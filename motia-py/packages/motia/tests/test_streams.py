# motia/tests/test_streams.py
"""Integration tests for Stream operations."""

import uuid

import pytest

from motia import Stream


@pytest.fixture
def stream(bridge) -> Stream:
    """Create a test stream with unique name."""
    stream_name = f"test_stream_{uuid.uuid4().hex[:8]}"
    return Stream(stream_name, bridge=bridge)


async def _check_streams_available(stream: Stream) -> bool:
    """Check if streams functions are available in the engine.

    The streams.* functions may not be available in all engine configurations.
    Returns True if available, False otherwise.
    """
    try:
        # Try to call get on a non-existent item
        # If streams module is not available, this will raise an exception
        await stream.get("__check__", "__check__")
        return True
    except Exception as e:
        if "function_not_found" in str(e):
            return False
        # Re-raise if it's a different error
        raise


@pytest.mark.asyncio
async def test_stream_set_and_get(stream):
    """Test setting and getting stream data."""
    if not await _check_streams_available(stream):
        pytest.skip("Streams module not available in engine configuration")

    group_id = f"group_{uuid.uuid4().hex[:8]}"
    item_id = f"item_{uuid.uuid4().hex[:8]}"
    data = {"name": "test", "value": 42}

    await stream.set(group_id, item_id, data)

    result = await stream.get(group_id, item_id)

    assert result is not None
    assert result["name"] == "test"
    assert result["value"] == 42


@pytest.mark.asyncio
async def test_stream_delete(stream):
    """Test deleting stream data."""
    if not await _check_streams_available(stream):
        pytest.skip("Streams module not available in engine configuration")

    group_id = f"group_delete_{uuid.uuid4().hex[:8]}"
    item_id = f"item_delete_{uuid.uuid4().hex[:8]}"

    await stream.set(group_id, item_id, {"temp": True})

    # Verify exists
    result = await stream.get(group_id, item_id)
    assert result is not None

    # Delete
    await stream.delete(group_id, item_id)

    # Verify deleted
    result = await stream.get(group_id, item_id)
    assert result is None


@pytest.mark.asyncio
async def test_stream_get_group(stream):
    """Test getting all items in a group."""
    if not await _check_streams_available(stream):
        pytest.skip("Streams module not available in engine configuration")

    group_id = f"group_list_{uuid.uuid4().hex[:8]}"

    # Add items
    for i in range(3):
        await stream.set(group_id, f"item_{i}", {"index": i})

    # Get group
    items = await stream.get_group(group_id)

    assert len(items) == 3


@pytest.mark.asyncio
async def test_stream_get_nonexistent(stream):
    """Test getting non-existent data returns None."""
    if not await _check_streams_available(stream):
        pytest.skip("Streams module not available in engine configuration")

    result = await stream.get("nonexistent_group", "nonexistent_item")
    assert result is None
