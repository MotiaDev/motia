"""Integration tests for stream trigger — handler fires on stream events."""

import asyncio
import time
from unittest.mock import patch

import pytest

from motia import Stream
from tests.conftest import flush_bridge_queue, wait_for_registration


@pytest.fixture
def test_stream(bridge) -> Stream:
    """Create a test stream using the test bridge."""
    stream_name = f"test_trigger_stream_{int(time.time() * 1000)}"
    with patch("motia.streams.get_instance", return_value=bridge):
        return Stream(stream_name)


@pytest.mark.asyncio
async def test_stream_set_fires_stream_trigger_handler(bridge, test_stream):
    """Setting stream data fires registered stream trigger handler."""
    function_id = f"test.stream-trigger.set.{int(time.time() * 1000)}"
    received = []

    async def handler(data):
        received.append(data)

    bridge.register_function(function_id, handler)
    bridge.register_trigger(
        "stream",
        function_id,
        {"stream_name": test_stream._name},
    )

    await flush_bridge_queue(bridge)
    await wait_for_registration(bridge, function_id)

    group_id = f"trigger_group_{int(time.time() * 1000)}"
    item_id = f"trigger_item_{int(time.time() * 1000)}"

    with patch("motia.streams.get_instance", return_value=bridge):
        await test_stream.set(group_id, item_id, {"name": "test", "value": 1})

    await asyncio.sleep(2.0)

    assert len(received) >= 1


@pytest.mark.asyncio
async def test_stream_trigger_handler_receives_correct_payload(bridge, test_stream):
    """Handler receives correct stream event payload."""
    function_id = f"test.stream-trigger.payload.{int(time.time() * 1000)}"
    received = []

    async def handler(data):
        received.append(data)

    bridge.register_function(function_id, handler)
    bridge.register_trigger(
        "stream",
        function_id,
        {"stream_name": test_stream._name},
    )

    await flush_bridge_queue(bridge)
    await wait_for_registration(bridge, function_id)

    group_id = f"payload_group_{int(time.time() * 1000)}"
    item_id = f"payload_item_{int(time.time() * 1000)}"

    with patch("motia.streams.get_instance", return_value=bridge):
        await test_stream.set(group_id, item_id, {"name": "payload-test", "value": 42})

    await asyncio.sleep(2.0)

    assert len(received) >= 1
    payload = received[-1]
    assert payload.get("type") == "stream"
    assert payload.get("streamName") == test_stream._name
    assert payload.get("groupId") == group_id
    assert payload.get("id") == item_id
    event = payload.get("event", {})
    assert event.get("type") == "create"
    assert event.get("data") == {"name": "payload-test", "value": 42}


@pytest.mark.asyncio
async def test_stream_update_fires_handler_with_update_event(bridge, test_stream):
    """Stream update fires handler with update event."""
    function_id = f"test.stream-trigger.update.{int(time.time() * 1000)}"
    received = []

    async def handler(data):
        received.append(data)

    bridge.register_function(function_id, handler)
    bridge.register_trigger(
        "stream",
        function_id,
        {"stream_name": test_stream._name},
    )

    await flush_bridge_queue(bridge)
    await wait_for_registration(bridge, function_id)

    group_id = f"update_group_{int(time.time() * 1000)}"
    item_id = f"update_item_{int(time.time() * 1000)}"

    with patch("motia.streams.get_instance", return_value=bridge):
        await test_stream.set(group_id, item_id, {"value": 1})
        await asyncio.sleep(1.5)
        await test_stream.set(group_id, item_id, {"value": 2})

    await asyncio.sleep(1.5)

    assert len(received) >= 2
    last_event = received[-1].get("event", {})
    assert last_event.get("type") == "update"


@pytest.mark.asyncio
async def test_stream_delete_fires_handler_with_delete_event(bridge, test_stream):
    """Stream delete fires handler with delete event."""
    function_id = f"test.stream-trigger.delete.{int(time.time() * 1000)}"
    received = []

    async def handler(data):
        received.append(data)

    bridge.register_function(function_id, handler)
    bridge.register_trigger(
        "stream",
        function_id,
        {"stream_name": test_stream._name},
    )

    await flush_bridge_queue(bridge)
    await wait_for_registration(bridge, function_id)

    group_id = f"delete_group_{int(time.time() * 1000)}"
    item_id = f"delete_item_{int(time.time() * 1000)}"

    with patch("motia.streams.get_instance", return_value=bridge):
        await test_stream.set(group_id, item_id, {"temp": True})
        await asyncio.sleep(1.5)
        await test_stream.delete(group_id, item_id)

    await asyncio.sleep(1.5)

    assert len(received) >= 2
    last_event = received[-1].get("event", {})
    assert last_event.get("type") == "delete"


@pytest.mark.asyncio
async def test_condition_function_filters_stream_events(bridge, test_stream):
    """Condition function filters stream events."""
    function_id = f"test.stream-trigger.cond.{int(time.time() * 1000)}"
    condition_path = f"{function_id}::conditions::0"
    handler_calls = []

    async def handler(data):
        handler_calls.append(data)

    async def condition(input_data):
        event = input_data.get("event", {})
        data = event.get("data", {})
        return data.get("accept") is True

    bridge.register_function(function_id, handler)
    bridge.register_function(condition_path, condition)
    bridge.register_trigger(
        "stream",
        function_id,
        {
            "stream_name": test_stream._name,
            "condition_function_id": condition_path,
        },
    )

    await flush_bridge_queue(bridge)
    await wait_for_registration(bridge, function_id)
    await wait_for_registration(bridge, condition_path)

    group_id = f"cond_group_{int(time.time() * 1000)}"

    with patch("motia.streams.get_instance", return_value=bridge):
        await test_stream.set(group_id, "rejected", {"accept": False})
        await test_stream.set(group_id, "accepted", {"accept": True})

    await asyncio.sleep(2.0)

    assert len(handler_calls) == 1
