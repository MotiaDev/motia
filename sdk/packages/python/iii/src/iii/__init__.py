"""III SDK for Python."""

import asyncio
import logging

from .channels import ChannelReader, ChannelWriter, ReadableStream, WritableStream
from .context import Context, get_context, with_context
from .iii import III, ConnectionStateCallback, FunctionRef, IIIConnectionState, InitOptions, ReconnectionConfig
from .iii_types import FunctionInfo, HttpAuthConfig, HttpInvocationConfig, StreamChannelRef, WorkerInfo, WorkerStatus
from .logger import Logger
from .stream import (
    IStream,
    StreamAuthInput,
    StreamAuthResult,
    StreamDeleteInput,
    StreamGetInput,
    StreamJoinLeaveEvent,
    StreamJoinResult,
    StreamListGroupsInput,
    StreamListInput,
    StreamSetInput,
    StreamSetResult,
    StreamUpdateInput,
    UpdateDecrement,
    UpdateIncrement,
    UpdateMerge,
    UpdateOp,
    UpdateRemove,
    UpdateSet,
)
from .telemetry import get_meter, get_tracer, init_otel, is_initialized, shutdown_otel
from .telemetry_types import OtelConfig
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
    """Create an III client and auto-start its connection task."""
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
    "Logger",
    "Context",
    "get_context",
    "with_context",
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
    "FunctionInfo",
    "HttpAuthConfig",
    "HttpInvocationConfig",
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
    "UpdateDecrement",
    "UpdateIncrement",
    "UpdateMerge",
    "UpdateOp",
    "UpdateRemove",
    "UpdateSet",
    # Callbacks
    "FunctionsAvailableCallback",
    "RemoteFunctionHandler",
    # Telemetry
    "OtelConfig",
    "init_otel",
    "shutdown_otel",
    "get_tracer",
    "get_meter",
    "is_initialized",
    # Utility
    "configure_logging",
]
