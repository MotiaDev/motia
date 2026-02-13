"""State management for Motia framework."""

from typing import Any, TypeVar

from .tracing import operation_span, record_exception, set_span_ok

TData = TypeVar("TData")

STREAM_NAME = "$$internal-state"


class StateManager:
    """Internal state manager using streams."""

    def __init__(self) -> None:
        self._bridge: Any = None

    def _get_bridge(self) -> Any:
        """Lazy load bridge to avoid circular imports."""
        if self._bridge is None:
            from .bridge import bridge

            self._bridge = bridge
        return self._bridge

    async def get(self, group_id: str, item_id: str) -> Any | None:
        """Get a value from the state."""
        with operation_span(
            "state.get",
            **{
                "motia.state.group_id": group_id,
                "motia.state.item_id": item_id,
            },
        ) as span:
            try:
                result = await self._get_bridge().call(
                    "stream.get",
                    {
                        "stream_name": STREAM_NAME,
                        "group_id": group_id,
                        "item_id": item_id,
                    },
                )
                set_span_ok(span)
                return result
            except Exception as exc:
                record_exception(span, exc)
                raise

    async def set(self, group_id: str, item_id: str, data: Any) -> Any:
        """Set a value in the state."""
        with operation_span(
            "state.set",
            **{
                "motia.state.group_id": group_id,
                "motia.state.item_id": item_id,
            },
        ) as span:
            try:
                result = await self._get_bridge().call(
                    "stream.set",
                    {
                        "stream_name": STREAM_NAME,
                        "group_id": group_id,
                        "item_id": item_id,
                        "data": data,
                    },
                )
                set_span_ok(span)
                return result
            except Exception as exc:
                record_exception(span, exc)
                raise

    async def delete(self, group_id: str, item_id: str) -> Any | None:
        """Delete a value from the state."""
        with operation_span(
            "state.delete",
            **{
                "motia.state.group_id": group_id,
                "motia.state.item_id": item_id,
            },
        ) as span:
            try:
                result = await self._get_bridge().call(
                    "stream.delete",
                    {
                        "stream_name": STREAM_NAME,
                        "group_id": group_id,
                        "item_id": item_id,
                    },
                )
                set_span_ok(span)
                return result
            except Exception as exc:
                record_exception(span, exc)
                raise

    async def get_group(self, group_id: str) -> list[Any]:
        """Get all values in a group."""
        with operation_span(
            "state.list",
            **{
                "motia.state.group_id": group_id,
            },
        ) as span:
            try:
                items: list[Any] = await self._get_bridge().call(
                    "stream.list",
                    {
                        "stream_name": STREAM_NAME,
                        "group_id": group_id,
                    },
                )
                set_span_ok(span)
                return items
            except Exception as exc:
                record_exception(span, exc)
                raise

    async def list_groups(self) -> list[str]:
        """List all group IDs."""
        with operation_span("state.list_groups") as span:
            try:
                groups: list[str] = await self._get_bridge().call(
                    "stream.list_groups",
                    {
                        "stream_name": STREAM_NAME,
                    },
                )
                set_span_ok(span)
                return groups
            except Exception as exc:
                record_exception(span, exc)
                raise

    async def clear(self, group_id: str) -> None:
        """Clear all values in a group."""
        with operation_span(
            "state.clear",
            **{
                "motia.state.group_id": group_id,
            },
        ) as span:
            try:
                items = await self.get_group(group_id)
                for item in items:
                    if isinstance(item, dict) and "id" in item:
                        await self.delete(group_id, item["id"])
                set_span_ok(span)
            except Exception as exc:
                record_exception(span, exc)
                raise
