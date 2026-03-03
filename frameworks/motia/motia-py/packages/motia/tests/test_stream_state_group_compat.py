"""Tests for stream/state group listing via SDK calls."""

from unittest.mock import AsyncMock, patch

import pytest

from motia.state import StateManager
from motia.streams import Stream


@pytest.mark.asyncio
async def test_stream_get_group_uses_stream_list() -> None:
    """Stream.get_group should use stream.list SDK call."""
    mock_iii = AsyncMock()
    mock_iii.call = AsyncMock(return_value=[{"id": "a"}])

    with patch("motia.streams.get_instance", return_value=mock_iii):
        stream = Stream("todos")
        result = await stream.get_group("default")

    assert result == [{"id": "a"}]
    mock_iii.call.assert_awaited_once_with(
        "stream::list",
        {
            "stream_name": "todos",
            "group_id": "default",
        },
    )


@pytest.mark.asyncio
async def test_stream_get_group_propagates_errors() -> None:
    """Stream.get_group should propagate errors from stream.list."""
    mock_iii = AsyncMock()
    mock_iii.call = AsyncMock(side_effect=Exception("function_not_found"))

    with patch("motia.streams.get_instance", return_value=mock_iii):
        stream = Stream("todos")
        with pytest.raises(Exception, match="function_not_found"):
            await stream.get_group("default")

    mock_iii.call.assert_awaited_once_with(
        "stream::list",
        {"stream_name": "todos", "group_id": "default"},
    )


@pytest.mark.asyncio
async def test_state_list_uses_state_list() -> None:
    """StateManager.list should use state.list SDK call."""
    mock_iii = AsyncMock()
    mock_iii.call = AsyncMock(return_value=[{"id": "x"}])

    with patch("motia.state.get_instance", return_value=mock_iii):
        manager = StateManager()
        result = await manager.list("users")

    assert result == [{"id": "x"}]
    mock_iii.call.assert_awaited_once_with(
        "state::list",
        {
            "scope": "users",
        },
    )


@pytest.mark.asyncio
async def test_state_list_propagates_errors() -> None:
    """StateManager.list should propagate errors from state.list."""
    mock_iii = AsyncMock()
    mock_iii.call = AsyncMock(side_effect=Exception("function_not_found"))

    with patch("motia.state.get_instance", return_value=mock_iii):
        manager = StateManager()
        with pytest.raises(Exception, match="function_not_found"):
            await manager.list("users")

    mock_iii.call.assert_awaited_once_with(
        "state::list",
        {"scope": "users"},
    )
