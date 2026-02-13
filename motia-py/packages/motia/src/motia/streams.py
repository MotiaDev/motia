"""Stream implementation for Motia framework."""

import logging
from typing import TYPE_CHECKING, Any, Generic, TypeVar

from .tracing import operation_span, record_exception, set_span_ok

if TYPE_CHECKING:
    from iii import III

TData = TypeVar("TData")
log = logging.getLogger("motia.streams")


class Stream(Generic[TData]):
    """Stream for managing distributed state."""

    def __init__(self, stream_name: str, bridge: "III | None" = None) -> None:
        self.stream_name = stream_name
        self._bridge = bridge
        log.debug(f"Stream created: {stream_name}")

    def _get_bridge(self) -> Any:
        """Get the bridge instance."""
        if self._bridge is None:
            from .bridge import bridge

            self._bridge = bridge
        return self._bridge

    async def get(self, group_id: str, item_id: str) -> TData | None:
        """Get an item from the stream."""
        with operation_span(
            "stream.get",
            **{
                "motia.stream.name": self.stream_name,
                "motia.stream.group_id": group_id,
                "motia.stream.item_id": item_id,
            },
        ) as span:
            try:
                value: TData | None = await self._get_bridge().call(
                    "stream.get",
                    {
                        "stream_name": self.stream_name,
                        "group_id": group_id,
                        "item_id": item_id,
                    },
                )
                set_span_ok(span)
                return value
            except Exception as exc:
                record_exception(span, exc)
                raise

    async def set(self, group_id: str, item_id: str, data: TData) -> TData:
        """Set an item in the stream."""
        with operation_span(
            "stream.set",
            **{
                "motia.stream.name": self.stream_name,
                "motia.stream.group_id": group_id,
                "motia.stream.item_id": item_id,
            },
        ) as span:
            try:
                value: TData = await self._get_bridge().call(
                    "stream.set",
                    {
                        "stream_name": self.stream_name,
                        "group_id": group_id,
                        "item_id": item_id,
                        "data": data,
                    },
                )
                set_span_ok(span)
                return value
            except Exception as exc:
                record_exception(span, exc)
                raise

    async def delete(self, group_id: str, item_id: str) -> None:
        """Delete an item from the stream."""
        with operation_span(
            "stream.delete",
            **{
                "motia.stream.name": self.stream_name,
                "motia.stream.group_id": group_id,
                "motia.stream.item_id": item_id,
            },
        ) as span:
            try:
                await self._get_bridge().call(
                    "stream.delete",
                    {
                        "stream_name": self.stream_name,
                        "group_id": group_id,
                        "item_id": item_id,
                    },
                )
                set_span_ok(span)
            except Exception as exc:
                record_exception(span, exc)
                raise

    async def get_group(self, group_id: str) -> list[TData]:
        """Get all items in a group."""
        with operation_span(
            "stream.list",
            **{
                "motia.stream.name": self.stream_name,
                "motia.stream.group_id": group_id,
            },
        ) as span:
            try:
                items: list[TData] = await self._get_bridge().call(
                    "stream.list",
                    {
                        "stream_name": self.stream_name,
                        "group_id": group_id,
                    },
                )
                set_span_ok(span)
                return items
            except Exception as exc:
                record_exception(span, exc)
                raise

    async def list_groups(self) -> list[str]:
        """List all group IDs for the stream."""
        with operation_span(
            "stream.list_groups",
            **{
                "motia.stream.name": self.stream_name,
            },
        ) as span:
            try:
                groups: list[str] = await self._get_bridge().call(
                    "stream.list_groups",
                    {
                        "stream_name": self.stream_name,
                    },
                )
                set_span_ok(span)
                return groups
            except Exception as exc:
                record_exception(span, exc)
                raise
