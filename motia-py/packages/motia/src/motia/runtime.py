"""Runtime manager for Motia framework."""

import logging
import uuid
from typing import Any, Awaitable, Callable

from iii import get_context

from .streams import Stream
from .types import FlowContext, TriggerMetadata
from .types_stream import StreamAuthInput, StreamAuthResult, StreamConfig, StreamSubscription

log = logging.getLogger("motia.runtime")


class Motia:
    """Centralized runtime manager for Motia applications.

    The Motia class provides centralized configuration and initialization
    for streams, authentication, and lifecycle hooks.

    Example:
        motia = Motia()
        motia.add_stream(StreamConfig(name="users"), "streams/users.stream.py")
        motia.set_authenticate(my_auth_handler)
        await motia.initialize()
    """

    def __init__(self) -> None:
        """Initialize the Motia runtime."""
        self.streams: dict[str, Stream[Any]] = {}
        self._stream_configs: dict[str, StreamConfig] = {}
        self._authenticate: Callable[..., Awaitable[StreamAuthResult | bool]] | None = None
        self._bridge: Any = None

    def _get_bridge(self) -> Any:
        """Lazy load bridge to avoid circular imports."""
        if self._bridge is None:
            from .bridge import bridge

            self._bridge = bridge
        return self._bridge

    def add_stream(self, config: StreamConfig, file_path: str) -> Stream[Any]:
        """Add a stream to the runtime.

        Args:
            config: The stream configuration
            file_path: The path to the stream file

        Returns:
            The created Stream instance
        """
        stream: Stream[Any] = Stream(config.name)
        self.streams[config.name] = stream
        self._stream_configs[config.name] = config
        log.info(f"Stream added: {config.name} from {file_path}")
        return stream

    def set_authenticate(
        self,
        handler: Callable[..., Awaitable[StreamAuthResult | bool]],
    ) -> None:
        """Set the global stream authentication handler.

        Args:
            handler: Async function that returns True if authenticated
        """
        self._authenticate = handler

    def add_step(
        self,
        config: Any,
        step_path: str,
        handler: Callable[..., Awaitable[Any]],
        file_path: str | None = None,
    ) -> None:
        """Add a step to the runtime."""
        from .step_wrapper import register_step

        register_step(config, file_path or step_path, handler, streams=self.streams)

    async def initialize(self) -> None:
        """Initialize the runtime and register bridge functions.

        This registers all stream lifecycle handlers with the bridge:
        - Authentication handler for stream subscriptions
        - Join handler for when clients join stream groups
        - Leave handler for when clients leave stream groups
        """
        bridge = self._get_bridge()

        # Register authentication handler
        if self._authenticate:
            bridge.register_function("motia.streams.authenticate", self._handle_authenticate)
            log.debug("Registered stream authentication handler")

        has_join = any(config.on_join for config in self._stream_configs.values())
        has_leave = any(config.on_leave for config in self._stream_configs.values())

        if has_join:
            bridge.register_function("motia.streams.join", self._handle_join)
            bridge.register_trigger("streams:join", "motia.streams.join", {})
            log.debug("Registered stream join handler")

        if has_leave:
            bridge.register_function("motia.streams.leave", self._handle_leave)
            bridge.register_trigger("streams:leave", "motia.streams.leave", {})
            log.debug("Registered stream leave handler")

        from .setup_step_endpoint import setup_step_endpoint

        await setup_step_endpoint()

    async def _handle_authenticate(self, data: dict[str, Any]) -> dict[str, Any]:
        """Handle stream authentication."""
        if not self._authenticate:
            return {"authorized": True}

        input_data = StreamAuthInput(
            headers=data.get("headers", {}),
            path=data.get("path", ""),
            query_params=data.get("query_params", {}),
            addr=data.get("addr", ""),
        )

        context = self._build_context(input_data)
        result = await self._authenticate(input_data, context)
        if isinstance(result, bool):
            return {"authorized": result}
        if isinstance(result, StreamAuthResult):
            return result.model_dump()
        return {"authorized": bool(result)}

    def _build_context(self, input_data: Any | None = None) -> FlowContext:
        """Create a FlowContext for stream handlers."""
        from .state import StateManager

        context_data = get_context()

        async def emit(_event: Any) -> None:
            await self._get_bridge().call("enqueue", _event)

        return FlowContext(
            emit=emit,
            trace_id=str(uuid.uuid4()),
            state=StateManager(),
            logger=context_data.logger,
            streams=self.streams,
            trigger=TriggerMetadata(type="queue"),
            _input=input_data,
        )

    async def _handle_join(self, data: dict[str, Any]) -> dict[str, Any]:
        """Handle a client joining a stream group.

        Args:
            data: Join event data containing stream_name and group_id

        Returns:
            Response indicating success or failure
        """
        stream_name = data.get("stream_name")
        group_id = data.get("group_id")
        client_id = data.get("client_id") or data.get("id")
        auth_context = data.get("context")

        config = self._stream_configs.get(stream_name)
        if config and config.on_join:
            try:
                subscription = StreamSubscription(group_id=group_id, id=client_id)
                context = self._build_context()
                await config.on_join(subscription, context, auth_context)
            except Exception as e:
                log.error(f"Error in on_join handler for {stream_name}: {e}")
                return {"success": False, "error": str(e)}

        return {"success": True}

    async def _handle_leave(self, data: dict[str, Any]) -> dict[str, Any]:
        """Handle a client leaving a stream group.

        Args:
            data: Leave event data containing stream_name and group_id

        Returns:
            Response indicating success or failure
        """
        stream_name = data.get("stream_name")
        group_id = data.get("group_id")
        client_id = data.get("client_id") or data.get("id")
        auth_context = data.get("context")

        config = self._stream_configs.get(stream_name)
        if config and config.on_leave:
            try:
                subscription = StreamSubscription(group_id=group_id, id=client_id)
                context = self._build_context()
                await config.on_leave(subscription, context, auth_context)
            except Exception as e:
                log.error(f"Error in on_leave handler for {stream_name}: {e}")
                return {"success": False, "error": str(e)}

        return {"success": True}
