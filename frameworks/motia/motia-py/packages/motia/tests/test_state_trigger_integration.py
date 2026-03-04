"""Integration tests for state trigger — handler fires on state changes."""

import asyncio
import time
from unittest.mock import patch

import pytest

from motia.state import StateManager
from tests.conftest import flush_bridge_queue, wait_for_registration


@pytest.fixture
def state_manager(bridge) -> StateManager:
    """Create a test state manager using the test bridge."""
    return StateManager()


@pytest.mark.asyncio
async def test_state_set_fires_state_trigger_handler(bridge, state_manager):
    """Setting state fires registered state trigger handler."""
    function_id = f"test.state-trigger.set.{int(time.time() * 1000)}"
    received = []

    async def handler(data):
        received.append(data)

    bridge.register_function(function_id, handler)
    bridge.register_trigger("state", function_id, {})

    await flush_bridge_queue(bridge)
    await wait_for_registration(bridge, function_id)

    scope = f"trigger_scope_{int(time.time() * 1000)}"
    key = f"trigger_key_{int(time.time() * 1000)}"

    with patch("motia.state.get_instance", return_value=bridge):
        await state_manager.set(scope, key, {"value": "hello"})

    await asyncio.sleep(2.0)

    assert len(received) >= 1


@pytest.mark.asyncio
async def test_state_trigger_handler_receives_correct_payload(bridge, state_manager):
    """Handler receives state change payload with group_id and item_id."""
    function_id = f"test.state-trigger.payload.{int(time.time() * 1000)}"
    received = []

    async def handler(data):
        received.append(data)

    bridge.register_function(function_id, handler)
    bridge.register_trigger("state", function_id, {})

    await flush_bridge_queue(bridge)
    await wait_for_registration(bridge, function_id)

    scope = f"payload_scope_{int(time.time() * 1000)}"
    key = f"payload_key_{int(time.time() * 1000)}"

    with patch("motia.state.get_instance", return_value=bridge):
        await state_manager.set(scope, key, {"count": 42})

    await asyncio.sleep(2.0)

    assert len(received) >= 1
    payload = received[-1]
    assert payload.get("type") == "state"
    assert payload.get("group_id") == scope or payload.get("groupId") == scope
    assert payload.get("item_id") == key or payload.get("itemId") == key


@pytest.mark.asyncio
async def test_state_update_fires_handler(bridge, state_manager):
    """State update fires handler with updated data."""
    function_id = f"test.state-trigger.update.{int(time.time() * 1000)}"
    received = []

    async def handler(data):
        received.append(data)

    bridge.register_function(function_id, handler)
    bridge.register_trigger("state", function_id, {})

    await flush_bridge_queue(bridge)
    await wait_for_registration(bridge, function_id)

    scope = f"update_scope_{int(time.time() * 1000)}"
    key = f"update_key_{int(time.time() * 1000)}"

    with patch("motia.state.get_instance", return_value=bridge):
        await state_manager.set(scope, key, {"version": 1})
        await asyncio.sleep(1.5)
        await state_manager.set(scope, key, {"version": 2})

    await asyncio.sleep(1.5)

    assert len(received) >= 2


@pytest.mark.asyncio
async def test_state_delete_fires_handler(bridge, state_manager):
    """State delete fires handler."""
    function_id = f"test.state-trigger.delete.{int(time.time() * 1000)}"
    received = []

    async def handler(data):
        received.append(data)

    bridge.register_function(function_id, handler)
    bridge.register_trigger("state", function_id, {})

    await flush_bridge_queue(bridge)
    await wait_for_registration(bridge, function_id)

    scope = f"delete_scope_{int(time.time() * 1000)}"
    key = f"delete_key_{int(time.time() * 1000)}"

    with patch("motia.state.get_instance", return_value=bridge):
        await state_manager.set(scope, key, {"temp": True})
        await asyncio.sleep(1.5)
        await state_manager.delete(scope, key)

    await asyncio.sleep(1.5)

    # At least set + delete events
    assert len(received) >= 2


@pytest.mark.asyncio
async def test_condition_function_filters_state_events(bridge, state_manager):
    """Condition function filters state events."""
    function_id = f"test.state-trigger.cond.{int(time.time() * 1000)}"
    condition_path = f"{function_id}::conditions::0"
    handler_calls = []

    async def handler(data):
        handler_calls.append(data)

    async def condition(input_data):
        new_value = input_data.get("new_value") or input_data.get("newValue") or {}
        return new_value.get("accept") is True

    bridge.register_function(function_id, handler)
    bridge.register_function(condition_path, condition)
    bridge.register_trigger(
        "state",
        function_id,
        {"condition_function_id": condition_path},
    )

    await flush_bridge_queue(bridge)
    await wait_for_registration(bridge, function_id)
    await wait_for_registration(bridge, condition_path)

    scope = f"cond_scope_{int(time.time() * 1000)}"

    with patch("motia.state.get_instance", return_value=bridge):
        await state_manager.set(scope, "rejected", {"accept": False})
        await state_manager.set(scope, "accepted", {"accept": True})

    await asyncio.sleep(2.0)

    assert len(handler_calls) == 1
