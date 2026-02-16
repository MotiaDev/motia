"""State management for Motia framework."""

from __future__ import annotations

from typing import Any

from .iii import get_instance
from .tracing import operation_span, record_exception, set_span_ok


class StateManager:
    """Internal state manager using state SDK calls."""

    async def get(self, scope: str, key: str) -> Any | None:
        """Get a value from the state."""
        with operation_span(
            "state::get",
            **{"motia.state.scope": scope, "motia.state.key": key},
        ) as span:
            try:
                result = await get_instance().call("state::get", {"scope": scope, "key": key})
                set_span_ok(span)
                return result
            except Exception as exc:
                record_exception(span, exc)
                raise

    async def set(self, scope: str, key: str, data: Any) -> Any:
        """Set a value in the state."""
        with operation_span(
            "state::set",
            **{"motia.state.scope": scope, "motia.state.key": key},
        ) as span:
            try:
                result = await get_instance().call("state::set", {"scope": scope, "key": key, "data": data})
                set_span_ok(span)
                return result
            except Exception as exc:
                record_exception(span, exc)
                raise

    async def update(self, scope: str, key: str, ops: list[dict[str, Any]]) -> Any:
        """Update a value in the state using update operations."""
        with operation_span(
            "state::update",
            **{"motia.state.scope": scope, "motia.state.key": key},
        ) as span:
            try:
                result = await get_instance().call("state::update", {"scope": scope, "key": key, "ops": ops})
                set_span_ok(span)
                return result
            except Exception as exc:
                record_exception(span, exc)
                raise

    async def delete(self, scope: str, key: str) -> Any | None:
        """Delete a value from the state."""
        with operation_span(
            "state::delete",
            **{"motia.state.scope": scope, "motia.state.key": key},
        ) as span:
            try:
                result = await get_instance().call("state::delete", {"scope": scope, "key": key})
                set_span_ok(span)
                return result
            except Exception as exc:
                record_exception(span, exc)
                raise

    async def list(self, scope: str) -> list[Any]:
        """List all values in a scope."""
        with operation_span(
            "state::list",
            **{"motia.state.scope": scope},
        ) as span:
            try:
                items: list[Any] = await get_instance().call("state::list", {"scope": scope})
                set_span_ok(span)
                return items
            except Exception as exc:
                record_exception(span, exc)
                raise

    async def list_groups(self) -> list[str]:
        """List all scope IDs."""
        with operation_span("state::list_groups") as span:
            try:
                groups: list[str] = await get_instance().call("state::list_groups", {})
                set_span_ok(span)
                return groups
            except Exception as exc:
                record_exception(span, exc)
                raise

    async def clear(self, scope: str) -> None:
        """Clear all values in a scope."""
        with operation_span(
            "state::clear",
            **{"motia.state.scope": scope},
        ) as span:
            try:
                items = await self.list(scope)
                for item in items:
                    if isinstance(item, dict) and "id" in item:
                        await self.delete(scope, item["id"])
                set_span_ok(span)
            except Exception as exc:
                record_exception(span, exc)
                raise


stateManager = StateManager()
