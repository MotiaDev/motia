"""Tests for stream/state group listing via streams.list."""

from unittest.mock import AsyncMock

import pytest

from motia.state import StateManager
from motia.streams import Stream


@pytest.mark.asyncio
async def test_stream_get_group_uses_streams_list() -> None:
    """Stream.get_group should use streams.list on current engine versions."""
    bridge = AsyncMock()
    bridge.call = AsyncMock(return_value=[{"id": "a"}])

    stream = Stream("todos", bridge=bridge)
    result = await stream.get_group("default")

    assert result == [{"id": "a"}]
    bridge.call.assert_awaited_once_with(
        "stream.list",
        {
            "stream_name": "todos",
            "group_id": "default",
        },
    )


@pytest.mark.asyncio
async def test_stream_get_group_does_not_fallback_on_missing_function() -> None:
    """Stream.get_group should propagate errors from streams.list."""
    bridge = AsyncMock()
    bridge.call = AsyncMock(side_effect=Exception("function_not_found"))

    stream = Stream("todos", bridge=bridge)
    with pytest.raises(Exception, match="function_not_found"):
        await stream.get_group("default")

    bridge.call.assert_awaited_once_with(
        "stream.list",
        {"stream_name": "todos", "group_id": "default"},
    )


@pytest.mark.asyncio
async def test_state_get_group_uses_streams_list() -> None:
    """StateManager.get_group should use streams.list on current engine versions."""
    manager = StateManager()
    manager._bridge = AsyncMock()
    manager._bridge.call = AsyncMock(return_value=[{"id": "x"}])

    result = await manager.get_group("users")

    assert result == [{"id": "x"}]
    manager._bridge.call.assert_awaited_once_with(
        "stream.list",
        {
            "stream_name": "$$internal-state",
            "group_id": "users",
        },
    )


@pytest.mark.asyncio
async def test_state_get_group_does_not_fallback_on_missing_function() -> None:
    """StateManager.get_group should propagate errors from streams.list."""
    manager = StateManager()
    manager._bridge = AsyncMock()
    manager._bridge.call = AsyncMock(side_effect=Exception("function_not_found"))

    with pytest.raises(Exception, match="function_not_found"):
        await manager.get_group("users")

    manager._bridge.call.assert_awaited_once_with(
        "stream.list",
        {"stream_name": "$$internal-state", "group_id": "users"},
    )
