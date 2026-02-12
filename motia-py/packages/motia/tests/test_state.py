# motia/tests/test_state.py
"""Integration tests for StateManager."""

import uuid

import pytest

from motia.state import StateManager


@pytest.fixture
def state_manager(bridge) -> StateManager:
    """Create a test state manager with the test bridge."""
    manager = StateManager()
    # Override the bridge with the test fixture bridge
    manager._bridge = bridge
    return manager


async def _check_state_available(state_manager):
    """Check if state functions are available in the engine."""
    try:
        await state_manager.get(f"test_{uuid.uuid4().hex}", "check")
        return True
    except Exception as e:
        if "function_not_found" in str(e).lower():
            return False
        # Other errors might indicate the module exists but had an issue
        return True


@pytest.mark.asyncio
async def test_state_set_and_get(state_manager):
    """Test setting and getting state."""
    if not await _check_state_available(state_manager):
        pytest.skip("State module not available in engine configuration")

    group_id = f"test_group_{uuid.uuid4().hex[:8]}"
    item_id = f"test_item_{uuid.uuid4().hex[:8]}"
    value = {"status": "active", "count": 10}

    await state_manager.set(group_id, item_id, value)

    result = await state_manager.get(group_id, item_id)

    assert result is not None
    assert result["status"] == "active"
    assert result["count"] == 10


@pytest.mark.asyncio
async def test_state_delete(state_manager):
    """Test deleting state."""
    if not await _check_state_available(state_manager):
        pytest.skip("State module not available in engine configuration")

    group_id = f"delete_group_{uuid.uuid4().hex[:8]}"
    item_id = f"delete_item_{uuid.uuid4().hex[:8]}"

    await state_manager.set(group_id, item_id, {"temp": True})

    # Verify exists
    result = await state_manager.get(group_id, item_id)
    assert result is not None

    # Delete
    await state_manager.delete(group_id, item_id)

    # Verify deleted
    result = await state_manager.get(group_id, item_id)
    assert result is None


@pytest.mark.asyncio
async def test_state_get_nonexistent(state_manager):
    """Test getting non-existent state returns None."""
    if not await _check_state_available(state_manager):
        pytest.skip("State module not available in engine configuration")

    result = await state_manager.get(f"nonexistent_{uuid.uuid4().hex}", "nonexistent")
    assert result is None


@pytest.mark.asyncio
async def test_state_get_group(state_manager):
    """Test getting all items in a state group."""
    if not await _check_state_available(state_manager):
        pytest.skip("State module not available in engine configuration")

    group_id = f"group_list_{uuid.uuid4().hex[:8]}"

    # Add items
    for i in range(3):
        await state_manager.set(group_id, f"item_{i}", {"index": i})

    # Get group
    items = await state_manager.get_group(group_id)

    assert len(items) == 3
