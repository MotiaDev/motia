"""III SDK implementation for WebSocket communication with the III Engine."""

import asyncio
import json
import logging
import os
import platform
import random
import threading
import traceback
import uuid
from dataclasses import dataclass
from importlib.metadata import version
from typing import Any, Awaitable, Callable, Coroutine, Literal, TypeVar

import websockets
from websockets.asyncio.client import ClientConnection

from .channels import ChannelReader, ChannelWriter
from .iii_types import (
    FunctionInfo,
    HttpInvocationConfig,
    InvocationResultMessage,
    InvokeFunctionMessage,
    MessageType,
    RegisterFunctionInput,
    RegisterFunctionMessage,
    RegisterServiceInput,
    RegisterServiceMessage,
    RegisterTriggerInput,
    RegisterTriggerMessage,
    RegisterTriggerTypeInput,
    RegisterTriggerTypeMessage,
    StreamChannelRef,
    TriggerActionEnqueue,
    TriggerActionVoid,
    TriggerInfo,
    TriggerRequest,
    UnregisterFunctionMessage,
    UnregisterTriggerMessage,
    UnregisterTriggerTypeMessage,
    WorkerInfo,
)
from .stream import IStream
from .telemetry_types import OtelConfig
from .triggers import Trigger, TriggerConfig, TriggerHandler
from .types import Channel, RemoteFunctionData, RemoteTriggerTypeData, is_channel_ref

RemoteFunctionHandler = Callable[[Any], Awaitable[Any]]
TResult = TypeVar("TResult")

log = logging.getLogger("iii.iii")


class _TraceContextError(Exception):
    """Wraps a handler exception with the response traceparent from the active span."""

    def __init__(self, traceparent: str | None) -> None:
        self.traceparent = traceparent


IIIConnectionState = Literal["disconnected", "connecting", "connected", "reconnecting", "failed"]

ConnectionStateCallback = Callable[["IIIConnectionState"], None]


@dataclass
class ReconnectionConfig:
    """Configuration for WebSocket reconnection behavior.

    Attributes:
        initial_delay_ms: Starting delay in milliseconds. Default ``1000``.
        max_delay_ms: Maximum delay cap in milliseconds. Default ``30000``.
        backoff_multiplier: Exponential backoff multiplier. Default ``2.0``.
        jitter_factor: Random jitter factor (0--1). Default ``0.3``.
        max_retries: Maximum retry attempts. ``-1`` for infinite. Default ``-1``.
    """

    initial_delay_ms: int = 1000
    max_delay_ms: int = 30000
    backoff_multiplier: float = 2.0
    jitter_factor: float = 0.3
    max_retries: int = -1


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
    """Options for configuring the III SDK.

    Attributes:
        worker_name: Display name for this worker. Defaults to ``hostname:pid``.
        enable_metrics_reporting: Enable worker metrics via OpenTelemetry. Default ``True``.
        invocation_timeout_ms: Default timeout for ``trigger()`` in milliseconds. Default ``30000``.
        reconnection_config: WebSocket reconnection behavior.
        otel: OpenTelemetry configuration. Enabled by default.
            Set ``{'enabled': False}`` or env ``OTEL_ENABLED=false`` to disable.
        telemetry: Internal telemetry metadata.
    """

    worker_name: str | None = None
    enable_metrics_reporting: bool = True
    invocation_timeout_ms: int = DEFAULT_INVOCATION_TIMEOUT_MS
    reconnection_config: ReconnectionConfig | None = None
    otel: OtelConfig | dict[str, Any] | None = None
    telemetry: TelemetryOptions | None = None


class III:
    """WebSocket client for communication with the III Engine.

    Unlike the Node.js SDK which uses ``registerWorker()``, the Python SDK
    exposes the ``III`` class directly. Call ``connect()`` to establish the
    WebSocket connection, or use ``register_worker()`` for automatic connection.

    Args:
        address: WebSocket URL of the III engine (e.g. ``ws://localhost:49134``).
        options: Optional configuration. See ``InitOptions``.

    Examples:
        >>> iii = III('ws://localhost:49134', InitOptions(worker_name='my-worker'))
        >>> await iii.connect()
    """

    def __init__(self, address: str, options: InitOptions | None = None) -> None:
        self._address = address
        self._options = options or InitOptions()
        self._ws: ClientConnection | None = None
        self._functions: dict[str, RemoteFunctionData] = {}
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
        self._worker_id: str | None = None

        # Background event loop thread
        self._loop = asyncio.new_event_loop()
        self._thread = threading.Thread(target=self._loop.run_forever, daemon=True)
        self._thread.start()

    def _run_on_loop(self, coro: Coroutine[Any, Any, TResult]) -> TResult:
        """Submit a coroutine to the background loop and block for the result."""
        if threading.current_thread() is self._thread:
            raise RuntimeError(
                "Cannot call sync SDK methods from the event loop thread. " "Use async handler methods instead."
            )
        future = asyncio.run_coroutine_threadsafe(coro, self._loop)
        return future.result()

    def _schedule_on_loop(self, coro: Coroutine[Any, Any, object]) -> None:
        """Submit a coroutine to the background loop without waiting."""
        asyncio.run_coroutine_threadsafe(coro, self._loop)

    # Connection management

    def connect(self) -> None:
        """Connect to the WebSocket server."""
        self._run_on_loop(self._async_connect())

    def shutdown(self) -> None:
        """Disconnect from the WebSocket server and stop the background thread."""
        self._run_on_loop(self._async_shutdown())
        self._loop.call_soon_threadsafe(self._loop.stop)
        self._thread.join(timeout=5)

    async def _async_connect(self) -> None:
        """Connect to the WebSocket server."""
        self._running = True
        try:
            from .telemetry import attach_event_loop, init_otel

            loop = asyncio.get_running_loop()
            otel_cfg: OtelConfig | None = None
            if self._options.otel:
                if isinstance(self._options.otel, OtelConfig):
                    otel_cfg = self._options.otel
                else:
                    otel_cfg = OtelConfig(**self._options.otel)
            init_otel(config=otel_cfg, loop=loop)
            attach_event_loop(loop)
        except ImportError:
            pass
        self._set_connection_state("connecting")
        await self._do_connect()

    async def _async_shutdown(self) -> None:
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

            exponential_delay = config.initial_delay_ms * (config.backoff_multiplier**self._reconnect_attempt)
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
        # Re-register all (snapshot to avoid mutation from caller thread)
        for trigger_type_data in list(self._trigger_types.values()):
            await self._send(trigger_type_data.message)
        for svc in list(self._services.values()):
            await self._send(svc)
        for function_data in list(self._functions.values()):
            await self._send(function_data.message)
        for trigger in list(self._triggers.values()):
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
        self._schedule_on_loop(self._send(msg))

    @staticmethod
    def _log_task_exception(task: asyncio.Task[Any]) -> None:
        if task.cancelled():
            return
        exc = task.exception()
        if exc:
            if isinstance(exc, _TraceContextError) and exc.__cause__:
                exc = exc.__cause__
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

    async def _invoke_with_otel_context(
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
            from opentelemetry import propagate, trace

            otel_available = True
        except ImportError:
            otel_available = False

        if not otel_available:
            return await handler(data), None

        carrier: dict[str, str] = {}
        if traceparent:
            carrier["traceparent"] = traceparent
        if baggage:
            carrier["baggage"] = baggage
        parent_ctx = propagate.extract(carrier) if carrier else otel_context.get_current()
        tracer = trace.get_tracer("iii-python-sdk")
        with tracer.start_as_current_span(
            f"call {handler.__name__}",
            context=parent_ctx,
            kind=trace.SpanKind.SERVER,
        ) as span:
            try:
                result = await handler(data)
                span.set_status(trace.StatusCode.OK)
                response_traceparent = self._inject_traceparent()
                return result, response_traceparent
            except Exception as e:
                span.record_exception(e)
                span.set_status(trace.StatusCode.ERROR, str(e))
                response_traceparent = self._inject_traceparent()
                raise _TraceContextError(response_traceparent) from e

    def _resolve_channels(self, data: Any) -> Any:
        """Recursively resolve StreamChannelRef objects into ChannelReader/ChannelWriter instances."""
        if is_channel_ref(data):
            ref = StreamChannelRef(**data)
            return ChannelReader(self._address, ref) if ref.direction == "read" else ChannelWriter(self._address, ref)
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

        if not func or not func.handler:
            error_code = "function_not_invokable" if func else "function_not_found"
            if func:
                error_msg = "Function is HTTP-invoked and cannot be invoked locally"
            else:
                error_msg = f"Function '{path}' not found"
            log.warning(error_msg)
            if invocation_id:
                await self._send(
                    InvocationResultMessage(
                        invocation_id=invocation_id,
                        function_id=path,
                        error={"code": error_code, "message": error_msg},
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
                        error={"code": "invocation_failed", "message": str(e), "stacktrace": traceback.format_exc()},
                    )
                )
            return

        if not invocation_id:
            task = asyncio.create_task(
                self._invoke_with_otel_context(func.handler, resolved_data, traceparent, baggage)
            )
            task.add_done_callback(self._log_task_exception)
            return

        try:
            result, response_traceparent = await self._invoke_with_otel_context(
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
        except _TraceContextError as te:
            original = te.__cause__
            log.exception(f"Error in handler {path}")
            await self._send(
                InvocationResultMessage(
                    invocation_id=invocation_id,
                    function_id=path,
                    error={"code": "invocation_failed", "message": str(original), "stacktrace": traceback.format_exc()},
                    traceparent=te.traceparent,
                )
            )
        except Exception as e:
            log.exception(f"Error in handler {path}")
            await self._send(
                InvocationResultMessage(
                    invocation_id=invocation_id,
                    function_id=path,
                    error={"code": "invocation_failed", "message": str(e), "stacktrace": traceback.format_exc()},
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

    def get_connection_state(self) -> IIIConnectionState:
        """Get the current connection state."""
        return self._connection_state

    @property
    def worker_id(self) -> str | None:
        """The worker ID assigned by the engine, or None if not yet registered."""
        return self._worker_id

    # Public API

    def register_trigger_type(self, id: str, description: str, handler: TriggerHandler[Any]) -> None:
        """Register a custom trigger type with the engine.

        Args:
            id: Unique trigger type identifier.
            description: Human-readable description.
            handler: Handler implementing ``register_trigger`` and ``unregister_trigger``.
        """
        msg = RegisterTriggerTypeMessage(id=id, description=description)
        self._trigger_types[id] = RemoteTriggerTypeData(message=msg, handler=handler)
        self._send_if_connected(msg)

    def unregister_trigger_type(self, id: str) -> None:
        """Unregister a previously registered trigger type.

        Args:
            id: The trigger type ID to unregister.
        """
        self._trigger_types.pop(id, None)
        self._send_if_connected(UnregisterTriggerTypeMessage(id=id))

    def register_trigger(self, type: str, function_id: str, config: Any) -> Trigger:
        """Bind a trigger configuration to a registered function.

        Args:
            type: Trigger type (e.g. ``http``, ``queue``, ``cron``).
            function_id: ID of the function to invoke.
            config: Trigger-specific configuration.

        Returns:
            A Trigger handle with an ``unregister()`` method.

        Examples:
            >>> trigger = iii.register_trigger('http', 'greet', {'api_path': '/greet', 'http_method': 'GET'})
            >>> trigger.unregister()
        """
        trigger_id = str(uuid.uuid4())
        msg = RegisterTriggerMessage(
            id=trigger_id,
            trigger_type=trigger.type,
            function_id=trigger.function_id,
            config=trigger.config,
        )
        self._triggers[trigger_id] = msg
        self._send_if_connected(msg)

        def unregister() -> None:
            self._triggers.pop(trigger_id, None)
            self._send_if_connected(UnregisterTriggerMessage(id=trigger_id, trigger_type=msg.trigger_type))

        return Trigger(unregister)

    def register_function(
        self,
        func: RegisterFunctionInput | dict[str, Any],
        handler_or_invocation: RemoteFunctionHandler | HttpInvocationConfig,
    ) -> FunctionRef:
        """Register a function with the engine.

        Pass a handler for local execution, or an ``HttpInvocationConfig``
        for HTTP-invoked functions (Lambda, Cloudflare Workers, etc.).

        Args:
            path: Unique function identifier.
            handler_or_invocation: Async handler callable or HTTP invocation config.
            description: Human-readable description.
            metadata: Arbitrary metadata to attach to the function.

        Returns:
            A FunctionRef with ``id`` and ``unregister()`` method.

        Raises:
            ValueError: If ``path`` is empty or already registered.
            TypeError: If ``handler_or_invocation`` is not callable or HttpInvocationConfig.

        Examples:
            >>> async def greet(data):
            ...     return {'message': f"Hello, {data['name']}!"}
            >>> fn = iii.register_function('greet', greet, description='Greets a user')
        """
        if not path or not path.strip():
            raise ValueError("id is required")
        if func.id in self._functions:
            raise ValueError(f"function id '{func.id}' already registered")

        if isinstance(handler_or_invocation, HttpInvocationConfig):
            msg = RegisterFunctionMessage(
                id=func.id,
                invocation=handler_or_invocation,
                description=func.description,
                metadata=func.metadata,
                request_format=func.request_format,
                response_format=func.response_format,
            )
            self._send_if_connected(msg)
            self._functions[func.id] = RemoteFunctionData(message=msg)
        else:
            if not callable(handler_or_invocation):
                actual_type = type(handler_or_invocation).__name__
                raise TypeError(f"handler_or_invocation must be callable or HttpInvocationConfig, got {actual_type}")
            handler = handler_or_invocation
            msg = RegisterFunctionMessage(
                id=func.id,
                description=func.description,
                metadata=func.metadata,
                request_format=func.request_format,
                response_format=func.response_format,
            )
            self._send_if_connected(msg)

            if asyncio.iscoroutinefunction(handler):

                async def wrapped(input_data: Any) -> Any:
                    return await handler(input_data)

            else:

                async def wrapped(input_data: Any) -> Any:
                    return await self._loop.run_in_executor(None, handler, input_data)

            self._functions[func.id] = RemoteFunctionData(message=msg, handler=wrapped)

        func_id = func.id

        def unregister() -> None:
            self._functions.pop(func_id, None)
            self._send_if_connected(UnregisterFunctionMessage(id=func_id))

        return FunctionRef(id=func_id, unregister=unregister)

    def register_service(self, service: RegisterServiceInput | dict[str, Any]) -> None:
        if isinstance(service, dict):
            service = RegisterServiceInput(**service)
        msg = RegisterServiceMessage(
            id=service.id,
            name=service.name or service.id,
            description=service.description,
            parent_service_id=service.parent_service_id,
        )
        self._services[service.id] = msg
        self._send_if_connected(msg)

    async def trigger(self, request: "dict[str, Any] | TriggerRequest") -> Any:
        """Invoke a remote function.

        The routing behavior and return type depend on the ``action`` field:

        - No action: synchronous -- waits for the function to return.
        - ``TriggerAction.Enqueue(...)``: async via named queue -- returns ``EnqueueResult``.
        - ``TriggerAction.Void()``: fire-and-forget -- returns ``None``.

        Args:
            request: A ``TriggerRequest`` or dict with ``function_id``, ``payload``,
                and optional ``action`` / ``timeout_ms``.

        Returns:
            The result of the function invocation, or ``None`` for void calls.

        Raises:
            TimeoutError: If the invocation times out.

        Examples:
            >>> result = await iii.trigger({'function_id': 'greet', 'payload': {'name': 'World'}})
            >>> await iii.trigger({'function_id': 'notify', 'payload': {}, 'action': TriggerAction.Void()})
        """
        import warnings

        req = request if isinstance(request, dict) else request.model_dump()
        function_id = req["function_id"]
        payload = req.get("payload")
        action = req.get("action")

        if "timeout" in req and req["timeout"] is not None and "timeout_ms" not in req:
            warnings.warn(
                "TriggerRequest 'timeout' (seconds) is deprecated. Use 'timeout_ms' (milliseconds) instead.",
                DeprecationWarning,
                stacklevel=2,
            )
            timeout_ms: int = int(req["timeout"] * 1000)
        else:
            timeout_ms = req.get("timeout_ms") or self._options.invocation_timeout_ms

        timeout_secs = timeout_ms / 1000.0

        if isinstance(action, dict):
            if action.get("type") == "enqueue":
                action = TriggerActionEnqueue(queue=action["queue"])

        # Enqueue and default: send invocation_id, await response
        invocation_id = str(uuid.uuid4())
        future: asyncio.Future[Any] = self._loop.create_future()

        self._pending[invocation_id] = future

        enqueue_action: TriggerActionEnqueue | TriggerActionVoid | None = (
            action if isinstance(action, (TriggerActionEnqueue, TriggerActionVoid)) else None
        )

        await self._send(
            InvokeFunctionMessage(
                function_id=function_id,
                data=payload,
                invocation_id=invocation_id,
                traceparent=self._inject_traceparent(),
                baggage=self._inject_baggage(),
                action=enqueue_action,
            )
        )

        try:
            return await asyncio.wait_for(future, timeout=timeout_secs)
        except asyncio.TimeoutError:
            self._pending.pop(invocation_id, None)
            raise TimeoutError(f"Invocation of '{function_id}' timed out after {timeout_ms}ms")

    def list_functions(self) -> list[FunctionInfo]:
        """List all registered functions from the engine."""
        return self._run_on_loop(self._async_list_functions())

    async def _async_list_functions(self) -> list[FunctionInfo]:
        result = await self._async_trigger({"function_id": "engine::functions::list", "payload": {}})
        functions_data = result.get("functions", [])
        return [FunctionInfo(**f) for f in functions_data]

    def list_workers(self) -> list[WorkerInfo]:
        """List all connected workers from the engine."""
        return self._run_on_loop(self._async_list_workers())

    async def _async_list_workers(self) -> list[WorkerInfo]:
        result = await self._async_trigger({"function_id": "engine::workers::list", "payload": {}})
        workers_data = result.get("workers", [])
        return [WorkerInfo(**w) for w in workers_data]

    def list_triggers(self, include_internal: bool = False) -> list[TriggerInfo]:
        """List all registered triggers from the engine."""
        return self._run_on_loop(self._async_list_triggers(include_internal))

    async def _async_list_triggers(self, include_internal: bool = False) -> list[TriggerInfo]:
        result = await self._async_trigger(
            {
                "function_id": "engine::triggers::list",
                "payload": {"include_internal": include_internal},
            }
        )
        triggers_data = result.get("triggers", [])
        return [TriggerInfo(**t) for t in triggers_data]

    def create_channel(self, buffer_size: int | None = None) -> Channel:
        """Create a streaming channel pair for worker-to-worker data transfer.

        Returns a Channel with writer, reader, and their serializable refs
        that can be passed as fields in the invocation data to other functions.

        Args:
            buffer_size: Optional buffer size for the channel (default: 64).
        """
        return self._run_on_loop(self._async_create_channel(buffer_size))

    async def _async_create_channel(self, buffer_size: int | None = None) -> Channel:
        result = await self._async_trigger(
            {
                "function_id": "engine::channels::create",
                "payload": {"buffer_size": buffer_size},
            }
        )
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
            (telemetry_opts.language if telemetry_opts else None) or os.environ.get("LANG", "").split(".")[0] or None
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
            "pid": os.getpid(),
            "telemetry": telemetry,
        }

    def _register_worker_metadata(self) -> None:
        """Register this worker's metadata with the engine."""
        msg = InvokeFunctionMessage(
            function_id="engine::workers::register",
            data=self._get_worker_metadata(),
            traceparent=self._inject_traceparent(),
            baggage=self._inject_baggage(),
            action=TriggerActionVoid(),
        )
        asyncio.run_coroutine_threadsafe(self._send(msg), self._loop)

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
                    for cb in list(self._functions_available_callbacks):
                        cb(functions)

                self.register_function({"id": function_id}, handler)

            self._functions_available_trigger = self.register_trigger(
                {"type": "engine::functions-available", "function_id": function_id, "config": {}}
            )

        def unsubscribe() -> None:
            self._functions_available_callbacks.discard(callback)
            if len(self._functions_available_callbacks) == 0 and self._functions_available_trigger:
                self._functions_available_trigger.unregister()
                self._functions_available_trigger = None

        return unsubscribe

    def create_stream(self, stream_name: str, stream: IStream[Any]) -> None:
        """Register a custom stream implementation, overriding the engine default.

        Registers 5 of the 6 ``IStream`` methods (``get``, ``set``, ``delete``,
        ``list``, ``list_groups``). The ``update`` method is **not** registered
        -- atomic updates are handled by the engine's built-in stream update logic.

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

        async def delete_handler(data: Any) -> Any:
            from .stream import StreamDeleteInput

            input_data = StreamDeleteInput(**data) if isinstance(data, dict) else data
            result = await stream.delete(input_data)
            return result.model_dump() if result else None

        async def list_handler(data: Any) -> list[Any]:
            from .stream import StreamListInput

            input_data = StreamListInput(**data) if isinstance(data, dict) else data
            return await stream.list(input_data)

        async def list_groups_handler(data: Any) -> list[str]:
            from .stream import StreamListGroupsInput

            input_data = StreamListGroupsInput(**data) if isinstance(data, dict) else data
            return await stream.list_groups(input_data)

        self.register_function(f"stream::get({stream_name})", get_handler)
        self.register_function(f"stream::set({stream_name})", set_handler)
        self.register_function(f"stream::delete({stream_name})", delete_handler)
        self.register_function(f"stream::list({stream_name})", list_handler)
        self.register_function(f"stream::list_groups({stream_name})", list_groups_handler)


class TriggerAction:
    """Factory for creating trigger actions used with ``trigger()``.

    Examples:
        >>> from iii import TriggerAction
        >>> await iii.trigger({'function_id': 'process', 'payload': {}, 'action': TriggerAction.Enqueue('jobs')})
        >>> await iii.trigger({'function_id': 'notify', 'payload': {}, 'action': TriggerAction.Void()})
    """

    @staticmethod
    def Enqueue(queue: str) -> TriggerActionEnqueue:
        """Route the invocation through a named queue for async processing.

        Args:
            queue: Name of the target queue.
        """
        return TriggerActionEnqueue(queue=queue)

    @staticmethod
    def Void() -> TriggerActionVoid:
        """Fire-and-forget routing. No response is returned."""
        return TriggerActionVoid()
