"""III SDK implementation for WebSocket communication with the III Engine."""

import asyncio
import json
import logging
import os
import platform
import random
import uuid
from dataclasses import dataclass
from importlib.metadata import version
from typing import Any, Awaitable, Callable, Literal

import websockets
from websockets.asyncio.client import ClientConnection

from .channels import ChannelReader, ChannelWriter
from .context import Context, with_context
from .iii_types import (
    FunctionInfo,
    HttpInvocationConfig,
    InvocationResultMessage,
    InvokeFunctionMessage,
    MessageType,
    RegisterFunctionMessage,
    RegisterServiceMessage,
    RegisterTriggerMessage,
    RegisterTriggerTypeMessage,
    StreamChannelRef,
    UnregisterFunctionMessage,
    UnregisterTriggerMessage,
    UnregisterTriggerTypeMessage,
    WorkerInfo,
)
from .logger import Logger
from .stream import IStream
from .triggers import Trigger, TriggerConfig, TriggerHandler
from .types import Channel, RemoteFunctionData, RemoteTriggerTypeData, is_channel_ref

RemoteFunctionHandler = Callable[[Any], Awaitable[Any]]

log = logging.getLogger("iii.iii")

IIIConnectionState = Literal["disconnected", "connecting", "connected", "reconnecting", "failed"]

ConnectionStateCallback = Callable[["IIIConnectionState"], None]


@dataclass
class ReconnectionConfig:
    """Configuration for WebSocket reconnection behavior."""

    initial_delay_ms: int = 1000
    """Starting delay in milliseconds."""
    max_delay_ms: int = 30000
    """Maximum delay cap in milliseconds."""
    backoff_multiplier: float = 2.0
    """Exponential backoff multiplier."""
    jitter_factor: float = 0.3
    """Random jitter factor 0-1."""
    max_retries: int = -1
    """Maximum retry attempts, -1 for infinite."""


DEFAULT_RECONNECTION_CONFIG = ReconnectionConfig()
DEFAULT_INVOCATION_TIMEOUT_MS = 30000
MAX_QUEUE_SIZE = 1000


@dataclass
class FunctionRef:
    """Reference to a registered function, allowing programmatic unregistration."""

    id: str
    unregister: Callable[[], None]


@dataclass
class TelemetryOptions:
    """Telemetry metadata to be reported to the engine."""

    language: str | None = None
    project_name: str | None = None
    framework: str | None = None
    amplitude_api_key: str | None = None


@dataclass
class InitOptions:
    """Options for configuring the III SDK."""

    worker_name: str | None = None
    enable_metrics_reporting: bool = True
    invocation_timeout_ms: int = DEFAULT_INVOCATION_TIMEOUT_MS
    reconnection_config: ReconnectionConfig | None = None
    otel: dict[str, Any] | None = None
    telemetry: TelemetryOptions | None = None


class III:
    """WebSocket client for communication with the III Engine."""

    def __init__(self, address: str, options: InitOptions | None = None) -> None:
        self._address = address
        self._options = options or InitOptions()
        self._ws: ClientConnection | None = None
        self._functions: dict[str, RemoteFunctionData] = {}
        self._http_functions: dict[str, RegisterFunctionMessage] = {}
        self._services: dict[str, RegisterServiceMessage] = {}
        self._pending: dict[str, asyncio.Future[Any]] = {}
        self._triggers: dict[str, RegisterTriggerMessage] = {}
        self._trigger_types: dict[str, RemoteTriggerTypeData] = {}
        self._queue: list[dict[str, Any]] = []
        self._reconnect_task: asyncio.Task[None] | None = None
        self._running = False
        self._receiver_task: asyncio.Task[None] | None = None
        self._functions_available_callbacks: set[Callable[[list[FunctionInfo]], None]] = set()
        self._functions_available_trigger: Trigger | None = None
        self._functions_available_function_id: str | None = None
        self._reconnection_config = self._options.reconnection_config or DEFAULT_RECONNECTION_CONFIG
        self._reconnect_attempt = 0
        self._connection_state: IIIConnectionState = "disconnected"
        self._state_callbacks: set[ConnectionStateCallback] = set()
        self._worker_id: str | None = None

    # Connection management

    async def connect(self) -> None:
        """Connect to the WebSocket server."""
        self._running = True
        try:
            from .telemetry import attach_event_loop, init_otel
            loop = asyncio.get_running_loop()
            init_otel(loop=loop)
            attach_event_loop(loop)
        except ImportError:
            pass
        self._set_connection_state("connecting")
        await self._do_connect()

    async def shutdown(self) -> None:
        """Disconnect from the WebSocket server."""
        self._running = False

        for task in [self._reconnect_task, self._receiver_task]:
            if task:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        # Reject all pending invocations
        for invocation_id, future in list(self._pending.items()):
            if not future.done():
                future.set_exception(Exception("iii is shutting down"))
        self._pending.clear()

        if self._ws:
            await self._ws.close()
            self._ws = None

        self._state_callbacks.clear()
        self._set_connection_state("disconnected")

        try:
            from .telemetry import shutdown_otel_async
            await shutdown_otel_async()
        except ImportError:
            pass

    async def _do_connect(self) -> None:
        try:
            log.debug(f"Connecting to {self._address}")
            self._ws = await websockets.connect(self._address)
            log.info(f"Connected to {self._address}")
            await self._on_connected()
        except Exception as e:
            log.warning(f"Connection failed: {e}")
            if self._running:
                self._schedule_reconnect()

    def _schedule_reconnect(self) -> None:
        if not self._reconnect_task or self._reconnect_task.done():
            self._reconnect_task = asyncio.create_task(self._reconnect_loop())

    async def _reconnect_loop(self) -> None:
        config = self._reconnection_config
        while self._running and not self._ws:
            if config.max_retries != -1 and self._reconnect_attempt >= config.max_retries:
                self._set_connection_state("failed")
                log.error(f"Max reconnection retries ({config.max_retries}) reached, giving up")
                return

            exponential_delay = config.initial_delay_ms * (config.backoff_multiplier ** self._reconnect_attempt)
            capped_delay = min(exponential_delay, config.max_delay_ms)
            jitter = capped_delay * config.jitter_factor * (2 * random.random() - 1)
            delay_ms = max(0, capped_delay + jitter)

            self._set_connection_state("reconnecting")
            log.debug(f"Reconnecting in {delay_ms:.0f}ms (attempt {self._reconnect_attempt + 1})")

            await asyncio.sleep(delay_ms / 1000.0)
            self._reconnect_attempt += 1
            await self._do_connect()

    async def _on_connected(self) -> None:
        self._reconnect_attempt = 0
        self._set_connection_state("connected")
        # Re-register all
        for trigger_type_data in self._trigger_types.values():
            await self._send(trigger_type_data.message)
        for svc in self._services.values():
            await self._send(svc)
        for function_data in self._functions.values():
            await self._send(function_data.message)
        for msg in self._http_functions.values():
            await self._send(msg)
        for trigger in self._triggers.values():
            await self._send(trigger)

        # Flush queue (swap to avoid O(n^2) pop(0))
        pending, self._queue = self._queue, []
        for queued_msg in pending:
            if self._ws:
                await self._ws.send(json.dumps(queued_msg))

        # Register worker metadata
        self._register_worker_metadata()

        self._receiver_task = asyncio.create_task(self._receive_loop())

    async def _receive_loop(self) -> None:
        if not self._ws:
            return
        try:
            async for msg in self._ws:
                await self._handle_message(msg)
        except websockets.ConnectionClosed:
            log.debug("Connection closed")
            self._ws = None
            self._set_connection_state("disconnected")
            if self._running:
                self._schedule_reconnect()

    # Message handling

    def _to_dict(self, msg: Any) -> dict[str, Any]:
        if isinstance(msg, dict):
            return msg
        if hasattr(msg, "model_dump"):
            data: dict[str, Any] = msg.model_dump(by_alias=True, exclude_none=True)
            if "type" in data and hasattr(data["type"], "value"):
                data["type"] = data["type"].value
            return data
        return {"data": msg}

    async def _send(self, msg: Any) -> None:
        data = self._to_dict(msg)
        if self._ws and self._ws.state.name == "OPEN":
            log.debug(f"Send: {json.dumps(data)[:200]}")
            await self._ws.send(json.dumps(data))
        else:
            if len(self._queue) >= MAX_QUEUE_SIZE:
                log.warning("Message queue full, dropping oldest message")
                self._queue.pop(0)
            self._queue.append(data)

    def _enqueue(self, msg: Any) -> None:
        data = self._to_dict(msg)
        if len(self._queue) >= MAX_QUEUE_SIZE:
            log.warning("Message queue full, dropping oldest message")
            self._queue.pop(0)
        self._queue.append(data)

    def _send_if_connected(self, msg: Any) -> None:
        if not (self._ws and self._ws.state.name == "OPEN"):
            return
        try:
            task = asyncio.get_running_loop().create_task(self._send(msg))
            task.add_done_callback(self._log_task_exception)
        except RuntimeError:
            pass

    @staticmethod
    def _log_task_exception(task: asyncio.Task[Any]) -> None:
        if task.cancelled():
            return
        exc = task.exception()
        if exc:
            log.error(f"Error in fire-and-forget send: {exc}")

    async def _handle_message(self, raw: str | bytes) -> None:
        data = json.loads(raw if isinstance(raw, str) else raw.decode())
        msg_type = data.get("type")
        log.debug(f"Recv: {msg_type}")

        if msg_type == MessageType.INVOCATION_RESULT.value:
            self._handle_result(
                data.get("invocation_id", ""),
                data.get("result"),
                data.get("error"),
            )
        elif msg_type == MessageType.INVOKE_FUNCTION.value:
            asyncio.create_task(
                self._handle_invoke(
                    data.get("invocation_id"),
                    data.get("function_id", ""),
                    data.get("data"),
                    data.get("traceparent"),
                    data.get("baggage"),
                )
            )
        elif msg_type == MessageType.REGISTER_TRIGGER.value:
            asyncio.create_task(self._handle_trigger_registration(data))
        elif msg_type == MessageType.WORKER_REGISTERED.value:
            worker_id = data.get("worker_id", "")
            self._worker_id = worker_id
            log.debug(f"Worker registered with ID: {worker_id}")

    def _handle_result(self, invocation_id: str, result: Any, error: Any) -> None:
        future = self._pending.pop(invocation_id, None)
        if not future:
            log.debug(f"No pending invocation: {invocation_id}")
            return

        if error:
            future.set_exception(Exception(str(error)))
        else:
            future.set_result(result)

    def _inject_traceparent(self) -> str | None:
        """Return the current OTel span context as a W3C traceparent string, or None."""
        try:
            from opentelemetry import context as otel_context
            from opentelemetry import propagate
            carrier: dict[str, str] = {}
            propagate.inject(carrier, context=otel_context.get_current())
            return carrier.get("traceparent")
        except ImportError:
            return None

    def _inject_baggage(self) -> str | None:
        """Return the current OTel baggage as a W3C baggage header string, or None."""
        try:
            from opentelemetry import context as otel_context
            from opentelemetry import propagate
            carrier: dict[str, str] = {}
            propagate.inject(carrier, context=otel_context.get_current())
            return carrier.get("baggage")
        except ImportError:
            return None

    async def _invoke_with_context(
        self,
        handler: Any,
        data: Any,
        traceparent: str | None,
        baggage: str | None,
    ) -> tuple[Any, str | None]:
        """Run handler inside the OTel context extracted from traceparent/baggage.

        Returns (result, response_traceparent) where response_traceparent is captured
        inside the attached context so it reflects the handler's span.
        """
        try:
            from opentelemetry import context as otel_context
            from opentelemetry import propagate
            carrier: dict[str, str] = {}
            if traceparent:
                carrier["traceparent"] = traceparent
            if baggage:
                carrier["baggage"] = baggage
            parent_ctx = propagate.extract(carrier) if carrier else otel_context.get_current()
            token = otel_context.attach(parent_ctx)
            try:
                result = await handler(data)
                response_traceparent = self._inject_traceparent()
                return result, response_traceparent
            finally:
                otel_context.detach(token)
        except ImportError:
            return await handler(data), None

    def _resolve_channels(self, data: Any) -> Any:
        """Recursively resolve StreamChannelRef objects into ChannelReader/ChannelWriter instances."""
        if is_channel_ref(data):
            ref = StreamChannelRef(**data)
            return (
                ChannelReader(self._address, ref)
                if ref.direction == "read"
                else ChannelWriter(self._address, ref)
            )
        if isinstance(data, dict):
            return {k: self._resolve_channels(v) for k, v in data.items()}
        if isinstance(data, list):
            return [self._resolve_channels(v) for v in data]
        if isinstance(data, tuple):
            return tuple(self._resolve_channels(v) for v in data)
        return data

    async def _handle_invoke(
        self,
        invocation_id: str | None,
        path: str,
        data: Any,
        traceparent: str | None = None,
        baggage: str | None = None,
    ) -> None:
        func = self._functions.get(path)

        if not func:
            log.warning(f"Function not found: {path}")
            if invocation_id:
                await self._send(
                    InvocationResultMessage(
                        invocation_id=invocation_id,
                        function_id=path,
                        error={"code": "function_not_found", "message": f"Function '{path}' not found"},
                    )
                )
            return

        try:
            resolved_data = self._resolve_channels(data)
        except Exception as e:
            log.exception("Failed to resolve channel refs")
            if invocation_id:
                await self._send(
                    InvocationResultMessage(
                        invocation_id=invocation_id,
                        function_id=path,
                        error={"code": "invocation_failed", "message": str(e)},
                    )
                )
            return

        if not invocation_id:
            task = asyncio.create_task(
                self._invoke_with_context(func.handler, resolved_data, traceparent, baggage)
            )
            task.add_done_callback(self._log_task_exception)
            return

        try:
            result, response_traceparent = await self._invoke_with_context(
                func.handler,
                resolved_data,
                traceparent,
                baggage,
            )
            await self._send(
                InvocationResultMessage(
                    invocation_id=invocation_id,
                    function_id=path,
                    result=result,
                    traceparent=response_traceparent,
                )
            )
        except Exception as e:
            log.exception(f"Error in handler {path}")
            await self._send(
                InvocationResultMessage(
                    invocation_id=invocation_id,
                    function_id=path,
                    error={"code": "invocation_failed", "message": str(e)},
                )
            )

    async def _handle_trigger_registration(self, data: dict[str, Any]) -> None:
        trigger_type_id = data.get("trigger_type")
        handler_data = self._trigger_types.get(trigger_type_id) if trigger_type_id else None

        trigger_id = data.get("id", "")
        function_id = data.get("function_id", "")
        config = data.get("config")

        result_base = {
            "type": MessageType.TRIGGER_REGISTRATION_RESULT.value,
            "id": trigger_id,
            "trigger_type": trigger_type_id,
            "function_id": function_id,
        }

        if not handler_data:
            return

        try:
            await handler_data.handler.register_trigger(
                TriggerConfig(id=trigger_id, function_id=function_id, config=config)
            )
            await self._send(result_base)
        except Exception as e:
            log.exception(f"Error registering trigger {trigger_id}")
            await self._send({**result_base, "error": {"code": "trigger_registration_failed", "message": str(e)}})

    # Connection state management

    def _set_connection_state(self, state: IIIConnectionState) -> None:
        if self._connection_state != state:
            self._connection_state = state
            for callback in self._state_callbacks:
                try:
                    callback(state)
                except Exception:
                    log.exception("Error in connection state callback")

    def get_connection_state(self) -> IIIConnectionState:
        """Get the current connection state."""
        return self._connection_state

    def on_connection_state_change(self, callback: ConnectionStateCallback) -> Callable[[], None]:
        """Register a callback to be notified of connection state changes.

        The callback is immediately invoked with the current state.

        Returns:
            A function to unregister the callback.
        """
        self._state_callbacks.add(callback)
        callback(self._connection_state)

        def unsubscribe() -> None:
            self._state_callbacks.discard(callback)

        return unsubscribe

    @property
    def worker_id(self) -> str | None:
        """The worker ID assigned by the engine, or None if not yet registered."""
        return self._worker_id

    # Public API

    def register_trigger_type(self, id: str, description: str, handler: TriggerHandler[Any]) -> None:
        msg = RegisterTriggerTypeMessage(id=id, description=description)
        self._trigger_types[id] = RemoteTriggerTypeData(message=msg, handler=handler)
        self._send_if_connected(msg)

    def unregister_trigger_type(self, id: str) -> None:
        self._trigger_types.pop(id, None)
        self._send_if_connected(UnregisterTriggerTypeMessage(id=id))

    def register_trigger(self, type: str, function_id: str, config: Any) -> Trigger:
        trigger_id = str(uuid.uuid4())
        msg = RegisterTriggerMessage(
            id=trigger_id,
            trigger_type=type,
            function_id=function_id,
            config=config,
        )
        self._triggers[trigger_id] = msg
        self._send_if_connected(msg)

        def unregister() -> None:
            self._triggers.pop(trigger_id, None)
            self._send_if_connected(UnregisterTriggerMessage(id=trigger_id, trigger_type=msg.trigger_type))

        return Trigger(unregister)

    def register_function(
        self,
        path: str,
        handler: RemoteFunctionHandler,
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> FunctionRef:
        if not path or not path.strip():
            raise ValueError("id is required")
        if path in self._http_functions:
            raise ValueError(f"function id '{path}' already registered as HTTP function")

        msg = RegisterFunctionMessage(id=path, description=description, metadata=metadata)
        self._send_if_connected(msg)

        async def wrapped(input_data: Any) -> Any:
            logger = Logger(function_name=path)
            ctx = Context(logger=logger)
            return await with_context(lambda _: handler(input_data), ctx)

        self._functions[path] = RemoteFunctionData(message=msg, handler=wrapped)

        def unregister() -> None:
            self._functions.pop(path, None)
            self._send_if_connected(UnregisterFunctionMessage(id=path))

        return FunctionRef(id=path, unregister=unregister)

    def register_http_function(self, id: str, config: HttpInvocationConfig) -> FunctionRef:
        if not id or not id.strip():
            raise ValueError("id is required")
        if id in self._functions or id in self._http_functions:
            raise ValueError(f"function id '{id}' already registered")

        msg = RegisterFunctionMessage(
            id=id,
            invocation=config,
        )
        self._send_if_connected(msg)
        self._http_functions[id] = msg

        def unregister() -> None:
            self._http_functions.pop(id, None)
            self._send_if_connected(UnregisterFunctionMessage(id=id))

        return FunctionRef(id=id, unregister=unregister)

    def register_service(self, id: str, description: str | None = None, parent_id: str | None = None) -> None:
        msg = RegisterServiceMessage(id=id, description=description, parent_service_id=parent_id)
        self._services[id] = msg
        self._send_if_connected(msg)

    async def trigger(self, path: str, data: Any, timeout: float = 30.0) -> Any:
        invocation_id = str(uuid.uuid4())
        future: asyncio.Future[Any] = asyncio.get_running_loop().create_future()

        self._pending[invocation_id] = future

        await self._send(
            InvokeFunctionMessage(
                function_id=path,
                data=data,
                invocation_id=invocation_id,
                traceparent=self._inject_traceparent(),
                baggage=self._inject_baggage(),
            )
        )

        try:
            return await asyncio.wait_for(future, timeout=timeout)
        except asyncio.TimeoutError:
            self._pending.pop(invocation_id, None)
            raise TimeoutError(f"Invocation of '{path}' timed out after {timeout}s")

    def trigger_void(self, path: str, data: Any) -> None:
        msg = InvokeFunctionMessage(
            function_id=path,
            data=data,
            traceparent=self._inject_traceparent(),
            baggage=self._inject_baggage(),
        )
        try:
            asyncio.get_running_loop().create_task(self._send(msg))
        except RuntimeError:
            self._enqueue(msg)

    async def call(self, path: str, data: Any, timeout: float = 30.0) -> Any:
        return await self.trigger(path, data, timeout)

    def call_void(self, path: str, data: Any) -> None:
        self.trigger_void(path, data)

    async def list_functions(self) -> list[FunctionInfo]:
        """List all registered functions from the engine."""
        result = await self.trigger("engine::functions::list", {})
        functions_data = result.get("functions", [])
        return [FunctionInfo(**f) for f in functions_data]

    async def list_workers(self) -> list[WorkerInfo]:
        """List all connected workers from the engine."""
        result = await self.trigger("engine::workers::list", {})
        workers_data = result.get("workers", [])
        return [WorkerInfo(**w) for w in workers_data]

    async def create_channel(self, buffer_size: int | None = None) -> Channel:
        """Create a streaming channel pair for worker-to-worker data transfer.

        Returns a Channel with writer, reader, and their serializable refs
        that can be passed as fields in the invocation data to other functions.

        Args:
            buffer_size: Optional buffer size for the channel (default: 64).
        """
        result = await self.call("engine::channels::create", {"buffer_size": buffer_size})
        writer_ref = StreamChannelRef(**result["writer"])
        reader_ref = StreamChannelRef(**result["reader"])
        return Channel(
            writer=ChannelWriter(self._address, writer_ref),
            reader=ChannelReader(self._address, reader_ref),
            writer_ref=writer_ref,
            reader_ref=reader_ref,
        )

    def _get_worker_metadata(self) -> dict[str, Any]:
        """Get worker metadata for registration."""
        try:
            sdk_version = version("iii-sdk")
        except Exception:
            sdk_version = "unknown"

        worker_name = self._options.worker_name or f"{platform.node()}:{os.getpid()}"

        telemetry_opts = self._options.telemetry
        language = (
            (telemetry_opts.language if telemetry_opts else None)
            or os.environ.get("LANG", "").split(".")[0]
            or None
        )

        telemetry: dict[str, Any] = {
            "language": language,
            "project_name": telemetry_opts.project_name if telemetry_opts else None,
            "framework": telemetry_opts.framework if telemetry_opts else None,
            "amplitude_api_key": telemetry_opts.amplitude_api_key if telemetry_opts else None,
        }

        return {
            "runtime": "python",
            "version": sdk_version,
            "name": worker_name,
            "os": f"{platform.system()} {platform.release()} ({platform.machine()})",
            "telemetry": telemetry,
        }

    def _register_worker_metadata(self) -> None:
        """Register this worker's metadata with the engine."""
        self.trigger_void("engine::workers::register", self._get_worker_metadata())

    def on_functions_available(self, callback: Callable[[list[FunctionInfo]], None]) -> Callable[[], None]:
        """Subscribe to function availability events.

        Args:
            callback: Function to call when functions become available. Receives list of FunctionInfo.

        Returns:
            Unsubscribe function that removes the callback and cleans up the trigger if no callbacks remain.
        """
        self._functions_available_callbacks.add(callback)

        if not self._functions_available_trigger:
            if not self._functions_available_function_id:
                self._functions_available_function_id = f"iii.on_functions_available.{uuid.uuid4()}"

            function_id = self._functions_available_function_id
            if function_id not in self._functions:

                async def handler(data: dict[str, Any]) -> None:
                    functions_data = data.get("functions", [])
                    functions = [FunctionInfo(**f) for f in functions_data]
                    for cb in self._functions_available_callbacks:
                        cb(functions)

                self.register_function(function_id, handler)

            self._functions_available_trigger = self.register_trigger("engine::functions-available", function_id, {})

        def unsubscribe() -> None:
            self._functions_available_callbacks.discard(callback)
            if len(self._functions_available_callbacks) == 0 and self._functions_available_trigger:
                self._functions_available_trigger.unregister()
                self._functions_available_trigger = None

        return unsubscribe

    def on(self, event: str, callback: Callable[..., None]) -> Callable[[], None]:
        """Subscribe to an event.

        Not supported in the Python SDK. Use on_connection_state_change() or
        on_functions_available() instead.

        Raises:
            NotImplementedError: Always raised. Use specific event methods instead.
        """
        raise NotImplementedError(
            "on() is not supported in the Python SDK. "
            "Use on_connection_state_change() or on_functions_available() instead."
        )

    def create_stream(self, stream_name: str, stream: IStream[Any]) -> None:
        """Register stream functions for a given stream.

        This registers the following functions for the stream:
        - {stream_name}::get
        - {stream_name}::set
        - {stream_name}::delete
        - {stream_name}::list
        - {stream_name}::list_groups
        - {stream_name}::update

        Args:
            stream_name: The name of the stream.
            stream: The stream implementation.
        """
        async def get_handler(data: Any) -> Any:
            from .stream import StreamGetInput
            input_data = StreamGetInput(**data) if isinstance(data, dict) else data
            return await stream.get(input_data)

        async def set_handler(data: Any) -> Any:
            from .stream import StreamSetInput
            input_data = StreamSetInput(**data) if isinstance(data, dict) else data
            result = await stream.set(input_data)
            return result.model_dump() if result else None

        async def delete_handler(data: Any) -> None:
            from .stream import StreamDeleteInput
            input_data = StreamDeleteInput(**data) if isinstance(data, dict) else data
            await stream.delete(input_data)

        async def list_handler(data: Any) -> list[Any]:
            from .stream import StreamListInput
            input_data = StreamListInput(**data) if isinstance(data, dict) else data
            return await stream.list(input_data)

        async def list_groups_handler(data: Any) -> list[str]:
            from .stream import StreamListGroupsInput
            input_data = StreamListGroupsInput(**data) if isinstance(data, dict) else data
            return await stream.list_groups(input_data)

        async def update_handler(data: Any) -> Any:
            from .stream import StreamUpdateInput
            input_data = StreamUpdateInput(**data) if isinstance(data, dict) else data
            result = await stream.update(input_data)
            return result.model_dump() if result else None

        self.register_function(f"stream::get({stream_name})", get_handler)
        self.register_function(f"stream::set({stream_name})", set_handler)
        self.register_function(f"stream::delete({stream_name})", delete_handler)
        self.register_function(f"stream::list({stream_name})", list_handler)
        self.register_function(f"stream::list_groups({stream_name})", list_groups_handler)
        self.register_function(f"stream::update({stream_name})", update_handler)
