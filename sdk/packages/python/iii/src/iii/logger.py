"""Logger implementation for the III SDK."""
from __future__ import annotations

import logging
import time
from typing import Any

log = logging.getLogger("iii.logger")

_SEVERITY_MAP = {
    "info": ("INFO", 9),    # SeverityNumber.INFO
    "warn": ("WARN", 13),   # SeverityNumber.WARN
    "error": ("ERROR", 17), # SeverityNumber.ERROR
    "debug": ("DEBUG", 5),  # SeverityNumber.DEBUG
}


def is_initialized() -> bool:
    """Return True if OTel has been initialized (importable without circular dep)."""
    try:
        from .telemetry import is_initialized as _is_init
        return _is_init()
    except ImportError:
        return False


class Logger:
    """Logger that emits OTel LogRecords when OTel is active, otherwise
    falls back to Python logging."""

    def __init__(self, function_name: str | None = None) -> None:
        self._function_name = function_name or ""

    def _emit_otel(self, level: str, message: str, data: Any = None) -> bool:
        """Emit an OTel LogRecord. Returns True if emitted, False if OTel not active."""
        if not is_initialized():
            return False
        try:
            from opentelemetry import _logs, trace
            from opentelemetry._logs import LogRecord, SeverityNumber

            severity_text, severity_num = _SEVERITY_MAP[level]
            otel_logger = _logs.get_logger("iii.logger")
            attrs: dict[str, Any] = {"function_name": self._function_name}
            if data is not None:
                attrs["data"] = str(data)

            span_ctx = trace.get_current_span().get_span_context()
            trace_id = span_ctx.trace_id if span_ctx.is_valid else 0
            span_id = span_ctx.span_id if span_ctx.is_valid else 0
            trace_flags = span_ctx.trace_flags if span_ctx.is_valid else trace.TraceFlags(0)

            record = LogRecord(
                timestamp=time.time_ns(),
                observed_timestamp=time.time_ns(),
                severity_text=severity_text,
                severity_number=SeverityNumber(severity_num),
                body=message,
                attributes=attrs,
                trace_id=trace_id,
                span_id=span_id,
                trace_flags=trace_flags,
            )
            otel_logger.emit(record)
            return True
        except Exception:
            return False

    def _emit(self, level: str, message: str, data: Any = None) -> None:
        """Emit a log message via OTel, or Python logging as fallback."""
        if self._emit_otel(level, message, data):
            return
        _LOG_METHODS = {
            "info": log.info,
            "warn": log.warning,
            "error": log.error,
            "debug": log.debug,
        }
        log_fn = _LOG_METHODS.get(level, log.info)
        log_fn("[%s] %s", self._function_name, message, extra={"data": data})

    def info(self, message: str, data: Any = None) -> None:
        self._emit("info", message, data)

    def warn(self, message: str, data: Any = None) -> None:
        self._emit("warn", message, data)

    def error(self, message: str, data: Any = None) -> None:
        self._emit("error", message, data)

    def debug(self, message: str, data: Any = None) -> None:
        self._emit("debug", message, data)
