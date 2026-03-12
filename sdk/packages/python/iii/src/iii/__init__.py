"""III SDK for Python."""

import asyncio
import logging

from .channels import ChannelReader, ChannelWriter, ReadableStream, WritableStream
from .iii import (
    III,
    ConnectionStateCallback,
    FunctionRef,
    IIIConnectionState,
    InitOptions,
    ReconnectionConfig,
    TriggerAction,
)
from .iii_types import (
    EnqueueResult,
    FunctionInfo,
    HttpAuthConfig,
    HttpInvocationConfig,
    OtelLogEvent,
    StreamChannelRef,
    TriggerActionEnqueue,
    TriggerActionVoid,
    TriggerInfo,
    TriggerRequest,
    WorkerInfo,
    WorkerStatus,
)
from .logger import Logger
from .stream import (
    DeleteResult,
    IStream,
    StreamAuthInput,
    StreamAuthResult,
    StreamDeleteInput,
    StreamDeleteResult,
    StreamGetInput,
    StreamJoinLeaveEvent,
    StreamJoinResult,
    StreamListGroupsInput,
    StreamListInput,
    StreamSetInput,
    StreamSetResult,
    StreamUpdateInput,
    StreamUpdateResult,
    UpdateDecrement,
    UpdateIncrement,
    UpdateMerge,
    UpdateOp,
    UpdateRemove,
    UpdateSet,
)
from .state import (
    DeleteResult,
    IState,
    StateDeleteInput,
    StateDeleteResult,
    StateEventData,
    StateEventType,
    StateGetInput,
    StateListInput,
    StateSetInput,
    StateSetResult,
    StateUpdateInput,
    StateUpdateResult,
)
from .telemetry import (
    current_span_id,
    current_trace_id,
    extract_baggage,
    extract_context,
    extract_traceparent,
    get_all_baggage,
    get_baggage_entry,
    get_logger,
    get_meter,
    get_tracer,
    init_otel,
    inject_baggage,
    inject_traceparent,
    is_initialized,
    remove_baggage_entry,
    set_baggage_entry,
    shutdown_otel,
    with_span,
)
from .telemetry_types import OtelConfig
from .worker_metrics import WorkerMetrics, WorkerMetricsCollector
from .otel_worker_gauges import register_worker_gauges, stop_worker_gauges
from .types import (
    ApiRequest,
    ApiResponse,
    Channel,
    FunctionsAvailableCallback,
    HttpRequest,
    HttpResponse,
    RemoteFunctionHandler,
)
from .utils import http, is_channel_ref


def register_worker(address: str, options: InitOptions | None = None) -> III:
    """Create an III client and auto-start its connection task.

    The WebSocket connection is established automatically. Must be called
    inside an async context with an active event loop.

    Args:
        address: WebSocket URL of the III engine (e.g. ``ws://localhost:49134``).
        options: Optional configuration for worker name, timeouts, reconnection, and OTel.

    Returns:
        A connected III client instance.

    Raises:
        RuntimeError: If no active asyncio event loop is found.

    Examples:
        >>> import asyncio
        >>> from iii import register_worker
        >>> async def main():
        ...     iii = register_worker('ws://localhost:49134', InitOptions(worker_name='my-worker'))
        >>> asyncio.run(main())
    """
    client = III(address, options)

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError as exc:
        raise RuntimeError(
            "iii.register_worker() requires an active asyncio event loop. "
            "Call it inside async code or use `client = III(...); await client.connect()`"
        ) from exc

    loop.create_task(client.connect())
    return client


def configure_logging(level: int = logging.INFO, format: str | None = None) -> None:
    """Configure logging for the III SDK.

    Args:
        level: Logging level (e.g., logging.DEBUG, logging.INFO)
        format: Log format string. Defaults to a simple format.
    """
    if format is None:
        format = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"

    logging.basicConfig(level=level, format=format)
    logging.getLogger("iii").setLevel(level)


__all__ = [
    # Core
    "III",
    "register_worker",
    "InitOptions",
    "ReconnectionConfig",
    "IIIConnectionState",
    "ConnectionStateCallback",
    "FunctionRef",
    "TriggerAction",
    "Logger",
    # API types
    "ApiRequest",
    "ApiResponse",
    "HttpRequest",
    "HttpResponse",
    "http",
    # Channel types
    "Channel",
    "ChannelWriter",
    "ChannelReader",
    "WritableStream",
    "ReadableStream",
    "StreamChannelRef",
    "is_channel_ref",
    # SDK types
    "EnqueueResult",
    "FunctionInfo",
    "HttpAuthConfig",
    "HttpInvocationConfig",
    "TriggerActionEnqueue",
    "TriggerActionVoid",
    "TriggerInfo",
    "TriggerRequest",
    "WorkerInfo",
    "WorkerStatus",
    # Stream types
    "IStream",
    "StreamAuthInput",
    "StreamAuthResult",
    "StreamDeleteInput",
    "StreamListInput",
    "StreamGetInput",
    "StreamJoinLeaveEvent",
    "StreamJoinResult",
    "StreamListGroupsInput",
    "StreamSetInput",
    "StreamSetResult",
    "StreamUpdateInput",
    "StreamUpdateResult",
    "StreamDeleteResult",
    "UpdateDecrement",
    "UpdateIncrement",
    "UpdateMerge",
    "UpdateOp",
    "UpdateRemove",
    "UpdateSet",
    # Callbacks
    "FunctionsAvailableCallback",
    "RemoteFunctionHandler",
    # State types
    "IState",
    "StateGetInput",
    "StateSetInput",
    "StateDeleteInput",
    "StateListInput",
    "StateUpdateInput",
    "StateSetResult",
    "StateUpdateResult",
    "StateDeleteResult",
    "DeleteResult",
    "StateEventType",
    "StateEventData",
    # Log event types
    "OtelLogEvent",
    # Telemetry
    "OtelConfig",
    "init_otel",
    "shutdown_otel",
    "get_tracer",
    "get_meter",
    "get_logger",
    "current_trace_id",
    "current_span_id",
    "is_initialized",
    "with_span",
    # Telemetry context/baggage helpers
    "inject_traceparent",
    "extract_traceparent",
    "inject_baggage",
    "extract_baggage",
    "extract_context",
    "get_baggage_entry",
    "set_baggage_entry",
    "remove_baggage_entry",
    "get_all_baggage",
    # Worker metrics
    "WorkerMetrics",
    "WorkerMetricsCollector",
    "register_worker_gauges",
    "stop_worker_gauges",
    # Utility
    "configure_logging",
]
