"""OpenTelemetry initialization for the III Python SDK.

Provides init_otel() / shutdown_otel() which set up distributed tracing
(via EngineSpanExporter), log export (via EngineLogExporter), and
auto-instrument urllib with rich HTTP attributes matching the Node.js SDK.
"""
from __future__ import annotations

import asyncio
import logging
import os
import uuid
from typing import Any

from .telemetry_types import OtelConfig

_tracer: Any = None
_meter: Any = None
_meter_provider: Any = None
_log_provider: Any = None
_connection: Any = None  # SharedEngineConnection | None
_initialized: bool = False
_fetch_patched: bool = False

_DEFAULT_SERVICE_NAME = "iii-python-sdk"


def init_otel(
    config: OtelConfig | None = None,
    loop: asyncio.AbstractEventLoop | None = None,
) -> None:
    """Initialize OpenTelemetry. Subsequent calls are no-ops.

    Args:
        config: OTel configuration.
        loop: Running asyncio event loop. When provided, SharedEngineConnection
              starts immediately. When None, the connection is started lazily
              on first use (pre-start buffer absorbs early frames).
    """
    global _tracer, _log_provider, _connection, _initialized, _fetch_patched

    if _initialized:
        return

    cfg = config or OtelConfig()

    enabled = cfg.enabled
    if enabled is None:
        env = os.environ.get("OTEL_ENABLED", "").lower()
        # Enabled by default; set OTEL_ENABLED=false/0/no/off to disable
        enabled = env not in ("false", "0", "no", "off")

    if not enabled:
        return

    try:
        from opentelemetry import trace
        from opentelemetry.sdk.resources import SERVICE_NAME, SERVICE_VERSION, Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
    except ImportError as exc:
        raise ImportError(
            "opentelemetry-api and opentelemetry-sdk are required. "
            "Install with: pip install 'iii-sdk[otel]'"
        ) from exc

    service_name = (
        cfg.service_name
        or os.environ.get("OTEL_SERVICE_NAME")
        or _DEFAULT_SERVICE_NAME
    )
    service_version = (
        cfg.service_version
        or os.environ.get("SERVICE_VERSION")
        or "unknown"
    )
    service_instance_id = cfg.service_instance_id or str(uuid.uuid4())

    resource_attrs: dict[str, Any] = {
        SERVICE_NAME: service_name,
        SERVICE_VERSION: service_version,
        "service.instance.id": service_instance_id,
        "telemetry.sdk.name": "iii-python-sdk",
        "telemetry.sdk.language": "python",
    }
    if cfg.service_namespace:
        resource_attrs["service.namespace"] = cfg.service_namespace

    resource = Resource.create(resource_attrs)

    # --- Span exporter ---
    from .telemetry_exporters import EngineSpanExporter, SharedEngineConnection

    ws_url = (
        cfg.engine_ws_url
        or os.environ.get("III_BRIDGE_URL")
        or "ws://localhost:49134"
    )
    _connection = SharedEngineConnection(ws_url)
    if loop is not None:
        _connection.start(loop)

    span_exporter = EngineSpanExporter(_connection)
    provider = TracerProvider(resource=resource)
    provider.add_span_processor(BatchSpanProcessor(span_exporter))  # type: ignore[arg-type]
    trace.set_tracer_provider(provider)
    _tracer = trace.get_tracer("iii-python-sdk")

    # --- Metrics exporter ---
    if cfg.metrics_enabled:
        _configure_meter_provider(resource, _connection, cfg, service_name)

    # --- Log exporter ---
    logs_enabled = cfg.logs_enabled if cfg.logs_enabled is not None else True
    if logs_enabled:
        _configure_log_provider(resource, _connection)

    _initialized = True

    if cfg.fetch_instrumentation_enabled:
        _enable_fetch_instrumentation()


def _configure_meter_provider(
    resource: Any,
    connection: Any,
    cfg: OtelConfig,
    service_name: str,
) -> None:
    """Set up a global MeterProvider with EngineMetricsExporter."""
    global _meter, _meter_provider
    try:
        from opentelemetry import metrics
        from opentelemetry.sdk.metrics import MeterProvider
        from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader

        from .telemetry_exporters import EngineMetricsExporter
    except ImportError:
        logging.getLogger("iii.telemetry").warning(
            "opentelemetry-sdk metrics not available; metrics export skipped."
        )
        return

    metrics_exporter = EngineMetricsExporter(connection)
    metric_reader = PeriodicExportingMetricReader(
        metrics_exporter,  # type: ignore[arg-type]
        export_interval_millis=cfg.metrics_export_interval_ms,
    )
    meter_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
    metrics.set_meter_provider(meter_provider)
    _meter_provider = meter_provider
    _meter = meter_provider.get_meter(service_name)


def _configure_log_provider(resource: Any, connection: Any) -> None:
    """Set up a global SdkLoggerProvider with EngineLogExporter."""
    global _log_provider
    try:
        from opentelemetry import _logs
        from opentelemetry.sdk._logs import LoggerProvider as SdkLoggerProvider
        from opentelemetry.sdk._logs.export import BatchLogRecordProcessor

        from .telemetry_exporters import EngineLogExporter
    except ImportError:
        logging.getLogger("iii.telemetry").warning(
            "opentelemetry-sdk logs not available; log export skipped."
        )
        return

    log_exporter = EngineLogExporter(connection)
    log_provider = SdkLoggerProvider(resource=resource)
    log_provider.add_log_record_processor(BatchLogRecordProcessor(log_exporter))  # type: ignore[arg-type]
    _logs.set_logger_provider(log_provider)
    _log_provider = log_provider


_original_opener_open: Any = None


def _enable_fetch_instrumentation() -> None:
    """Patch urllib.request.OpenerDirector.open to create OTel CLIENT spans.

    Custom instrumentation matching the Node.js SDK's patchGlobalFetch —
    uses new OTel semantic conventions and adds rich attributes (server.address,
    url.scheme, url.path, http.response.status_code, etc.).
    """
    global _fetch_patched, _original_opener_open

    try:
        from opentelemetry import context as otel_ctx
        from opentelemetry.propagate import inject as otel_inject
        from opentelemetry.trace import SpanKind, StatusCode
    except ImportError:
        logging.getLogger("iii.telemetry").warning(
            "opentelemetry-api not installed; urllib auto-instrumentation skipped."
        )
        return

    import socket
    import urllib.request
    from urllib.parse import urlparse

    _original_opener_open = urllib.request.OpenerDirector.open
    original = _original_opener_open

    def _patched_open(self: Any, fullurl: Any, data: Any = None, timeout: Any = socket.getdefaulttimeout()) -> Any:
        tracer = get_tracer()
        if tracer is None:
            return original(self, fullurl, data, timeout)

        # Parse URL and method
        if isinstance(fullurl, str):
            url = fullurl
            method = "POST" if data is not None else "GET"
        else:
            url = fullurl.full_url
            method = fullurl.get_method()

        attrs: dict[str, Any] = {"http.request.method": method, "url.full": url}

        try:
            parsed = urlparse(url)
            if parsed.hostname:
                attrs["server.address"] = parsed.hostname
            if parsed.scheme:
                attrs["url.scheme"] = parsed.scheme
                attrs["network.protocol.name"] = "http"
            if parsed.path:
                attrs["url.path"] = parsed.path
            if parsed.port:
                attrs["server.port"] = parsed.port
            if parsed.query:
                attrs["url.query"] = parsed.query
        except Exception:
            pass

        if data is not None and isinstance(data, (bytes, bytearray)):
            attrs["http.request.body.size"] = len(data)
        if not isinstance(fullurl, str) and fullurl.has_header("Content-type"):
            attrs["http.request.header.content-type"] = fullurl.get_header("Content-type")

        span_name = f"{method} {attrs.get('url.path', '')}" if "url.path" in attrs else method

        with tracer.start_as_current_span(span_name, kind=SpanKind.CLIENT, attributes=attrs) as span:
            # Convert string URL to Request so we can inject trace context headers
            if isinstance(fullurl, str):
                fullurl = urllib.request.Request(fullurl, data)
                data = None

            carrier: dict[str, str] = {}
            otel_inject(carrier, context=otel_ctx.get_current())
            for key, value in carrier.items():
                fullurl.add_unredirected_header(key, value)

            try:
                response = original(self, fullurl, data, timeout)

                span.set_attribute("http.response.status_code", response.status)

                cl = response.headers.get("content-length")
                if cl:
                    try:
                        span.set_attribute("http.response.body.size", int(cl))
                    except ValueError:
                        pass
                ct = response.headers.get("content-type")
                if ct:
                    span.set_attribute("http.response.header.content-type", ct)

                if response.status >= 400:
                    span.set_attribute("error.type", str(response.status))
                    span.set_status(StatusCode.ERROR)
                else:
                    span.set_status(StatusCode.OK)

                return response
            except Exception as exc:
                span.set_attribute("error.type", type(exc).__name__)
                span.set_status(StatusCode.ERROR, str(exc))
                span.record_exception(exc)
                raise

    urllib.request.OpenerDirector.open = _patched_open  # type: ignore[method-assign]
    _fetch_patched = True


def shutdown_otel() -> None:
    """Shut down OTel synchronously (best-effort; does not await WS flush)."""
    _reset_state()


async def shutdown_otel_async() -> None:
    """Shut down OTel and await WebSocket connection close."""
    global _connection
    if _connection is not None:
        await _connection.shutdown()
    _reset_state()


def _reset_state() -> None:
    global _tracer, _meter, _meter_provider, _log_provider, _connection, _initialized, _fetch_patched

    if _fetch_patched:
        try:
            import urllib.request
            if _original_opener_open is not None:
                urllib.request.OpenerDirector.open = _original_opener_open  # type: ignore[method-assign]
        except Exception:
            pass
        _fetch_patched = False

    if _initialized:
        try:
            from opentelemetry import trace
            provider = trace.get_tracer_provider()
            if hasattr(provider, "shutdown"):
                provider.shutdown()
        except Exception:
            pass
        try:
            if _meter_provider and hasattr(_meter_provider, "shutdown"):
                _meter_provider.shutdown()
        except Exception:
            pass
        try:
            if _log_provider and hasattr(_log_provider, "shutdown"):
                _log_provider.shutdown()
        except Exception:
            pass

    _tracer = None
    _meter = None
    _meter_provider = None
    _log_provider = None
    _connection = None
    _initialized = False


def attach_event_loop(loop: asyncio.AbstractEventLoop) -> None:
    """Wire the running asyncio event loop into the OTel connection.

    Call this from within an async context (e.g. III.connect()) after
    init_otel() has been called without a loop so that SharedEngineConnection
    starts sending buffered frames immediately.
    """
    if _initialized and _connection is not None and not _connection._started:
        _connection.start(loop)


def get_tracer() -> Any:
    """Return the active tracer, or None if OTel has not been initialized."""
    return _tracer


def get_meter() -> Any:
    """Return the active meter, or None if OTel metrics have not been initialized."""
    return _meter


def is_initialized() -> bool:
    """Return True if OTel has been successfully initialized."""
    return _initialized
