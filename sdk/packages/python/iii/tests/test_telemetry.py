"""Tests for OTel init/shutdown."""
import urllib.request
import pytest

from iii.telemetry import get_tracer, init_otel, is_initialized, shutdown_otel, shutdown_otel_async
from iii.telemetry_types import OtelConfig

# URLLibInstrumentor patches OpenerDirector.open, not urlopen directly
ORIGINAL_OPENER_OPEN = urllib.request.OpenerDirector.open


@pytest.fixture(autouse=True)
def cleanup():
    yield
    shutdown_otel()
    # Reset all OTel global singletons so tests don't bleed state
    try:
        import opentelemetry._logs._internal as _li
        _li._LOGGER_PROVIDER = None
        _li._LOGGER_PROVIDER_SET_ONCE._done = False
    except Exception:
        pass
    try:
        import opentelemetry.trace._internal as _ti
        _ti._TRACER_PROVIDER = None
        _ti._TRACER_PROVIDER_SET_ONCE._done = False
    except Exception:
        pass
    try:
        import opentelemetry.metrics._internal as _mi
        _mi._METER_PROVIDER = None
        _mi._METER_PROVIDER_SET_ONCE._done = False
    except Exception:
        pass
    urllib.request.OpenerDirector.open = ORIGINAL_OPENER_OPEN


def test_not_initialized_by_default():
    assert not is_initialized()
    assert get_tracer() is None


def test_init_disabled_when_enabled_is_false():
    init_otel(OtelConfig(enabled=False))
    assert not is_initialized()
    assert get_tracer() is None


def test_init_enabled():
    init_otel(OtelConfig(enabled=True))
    assert is_initialized()
    assert get_tracer() is not None


def test_init_patches_urlopen_by_default():
    init_otel(OtelConfig(enabled=True))
    assert urllib.request.OpenerDirector.open is not ORIGINAL_OPENER_OPEN


def test_init_skips_patch_when_disabled():
    init_otel(OtelConfig(enabled=True, fetch_instrumentation_enabled=False))
    assert urllib.request.OpenerDirector.open is ORIGINAL_OPENER_OPEN


def test_shutdown_restores_urlopen():
    init_otel(OtelConfig(enabled=True))
    assert urllib.request.OpenerDirector.open is not ORIGINAL_OPENER_OPEN
    shutdown_otel()
    assert urllib.request.OpenerDirector.open is ORIGINAL_OPENER_OPEN


def test_shutdown_clears_state():
    init_otel(OtelConfig(enabled=True))
    shutdown_otel()
    assert not is_initialized()
    assert get_tracer() is None


def test_init_is_idempotent():
    init_otel(OtelConfig(enabled=True))
    tracer1 = get_tracer()
    init_otel(OtelConfig(enabled=True))  # second call must be no-op
    assert get_tracer() is tracer1


def test_shutdown_without_init_is_safe():
    shutdown_otel()  # must not raise


def test_telemetry_apis_exported_from_package():
    import iii
    assert hasattr(iii, "init_otel")
    assert hasattr(iii, "shutdown_otel")
    assert hasattr(iii, "get_tracer")
    assert hasattr(iii, "is_initialized")
    assert hasattr(iii, "OtelConfig")


def test_init_configures_engine_span_exporter():
    """init_otel wires a BatchSpanProcessor(EngineSpanExporter) on the TracerProvider."""
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from iii.telemetry_exporters import EngineSpanExporter

    init_otel(OtelConfig(enabled=True))
    provider = trace.get_tracer_provider()
    assert isinstance(provider, TracerProvider)
    processors = provider._active_span_processor._span_processors
    bsp = next((p for p in processors if isinstance(p, BatchSpanProcessor)), None)
    assert bsp is not None
    assert isinstance(bsp.span_exporter, EngineSpanExporter)


def test_init_configures_log_provider():
    """init_otel sets up a global SdkLoggerProvider with EngineLogExporter."""
    from opentelemetry._logs import get_logger_provider
    from opentelemetry.sdk._logs import LoggerProvider as SdkLoggerProvider

    init_otel(OtelConfig(enabled=True))
    lp = get_logger_provider()
    assert isinstance(lp, SdkLoggerProvider)


def test_init_logs_disabled():
    """logs_enabled=False skips the logger provider setup."""
    from opentelemetry._logs import get_logger_provider
    from opentelemetry.sdk._logs import LoggerProvider as SdkLoggerProvider

    init_otel(OtelConfig(enabled=True, logs_enabled=False))
    lp = get_logger_provider()
    assert not isinstance(lp, SdkLoggerProvider)


def test_shutdown_closes_connection():
    """shutdown_otel_async() closes the SharedEngineConnection."""
    import asyncio
    from iii.telemetry_exporters import SharedEngineConnection
    from unittest.mock import patch, AsyncMock

    with patch.object(SharedEngineConnection, "start"), \
         patch.object(SharedEngineConnection, "shutdown", new_callable=AsyncMock) as mock_shutdown:
        init_otel(OtelConfig(enabled=True))
        asyncio.run(shutdown_otel_async())
        mock_shutdown.assert_called_once()
