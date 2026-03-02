"""Integration tests for queue enqueue and subscribe."""

import asyncio
import time

import pytest

from tests.conftest import flush_bridge_queue


@pytest.mark.asyncio
async def test_enqueue_delivers_message_to_subscribed_handler(bridge):
    """Enqueue delivers message to subscribed handler."""
    function_id = f"test.queue.basic.{int(time.time() * 1000)}"
    topic = f"test-topic-{int(time.time() * 1000)}"
    received = []

    async def handler(data):
        received.append(data)

    bridge.register_function(function_id, handler)
    bridge.register_trigger("queue", function_id, {"topic": topic})

    await flush_bridge_queue(bridge)
    await asyncio.sleep(0.5)

    await bridge.call("enqueue", {"topic": topic, "data": {"order": "abc"}})
    await asyncio.sleep(1.5)

    assert received == [{"order": "abc"}]


@pytest.mark.asyncio
async def test_handler_receives_exact_data_payload_from_enqueue(bridge):
    """Handler receives exact data payload from enqueue."""
    function_id = f"test.queue.payload.{int(time.time() * 1000)}"
    topic = f"test-topic-payload-{int(time.time() * 1000)}"
    payload = {"id": "x1", "count": 42, "nested": {"a": 1}}
    received = []

    async def handler(data):
        received.append(data)

    bridge.register_function(function_id, handler)
    bridge.register_trigger("queue", function_id, {"topic": topic})

    await flush_bridge_queue(bridge)
    await asyncio.sleep(0.5)

    await bridge.call("enqueue", {"topic": topic, "data": payload})
    await asyncio.sleep(1.5)

    assert received == [payload]


@pytest.mark.asyncio
async def test_subscription_with_infrastructure_config_receives_messages(bridge):
    """Subscription with infrastructure config receives messages."""
    function_id = f"test.queue.infra.{int(time.time() * 1000)}"
    topic = f"test-topic-infra-{int(time.time() * 1000)}"
    received = []

    async def handler(data):
        received.append(data)

    bridge.register_function(function_id, handler)
    bridge.register_trigger(
        "queue",
        function_id,
        {
            "topic": topic,
            "metadata": {
                "infrastructure": {
                    "queue": {
                        "maxRetries": 5,
                        "type": "standard",
                        "concurrency": 2,
                    }
                }
            },
        },
    )

    await flush_bridge_queue(bridge)
    await asyncio.sleep(0.5)

    await bridge.call("enqueue", {"topic": topic, "data": {"infra": True}})
    await asyncio.sleep(1.5)

    assert received == [{"infra": True}]


@pytest.mark.asyncio
async def test_multiple_subscribers_on_same_topic_both_receive_message(bridge):
    """Multiple subscribers on same topic both receive message."""
    topic = f"test-topic-multi-{int(time.time() * 1000)}"
    function_id1 = f"test.queue.multi1.{int(time.time() * 1000)}"
    function_id2 = f"test.queue.multi2.{int(time.time() * 1000)}"
    received1 = []
    received2 = []

    async def handler1(data):
        received1.append(data)

    async def handler2(data):
        received2.append(data)

    bridge.register_function(function_id1, handler1)
    bridge.register_function(function_id2, handler2)
    bridge.register_trigger("queue", function_id1, {"topic": topic})
    bridge.register_trigger("queue", function_id2, {"topic": topic})

    await flush_bridge_queue(bridge)
    await asyncio.sleep(0.5)

    await bridge.call("enqueue", {"topic": topic, "data": {"shared": True}})
    await asyncio.sleep(2.0)

    assert {"shared": True} in received1
    assert {"shared": True} in received2


@pytest.mark.asyncio
async def test_condition_function_filters_messages(bridge):
    """Condition function filters messages."""
    topic = f"test-topic-cond-{int(time.time() * 1000)}"
    function_id = f"test.queue.cond.{int(time.time() * 1000)}"
    condition_path = f"{function_id}::conditions::0"
    handler_calls = []

    async def handler(data):
        handler_calls.append(data)

    async def condition(input_data):
        return input_data.get("accept") is True

    bridge.register_function(function_id, handler)
    bridge.register_function(condition_path, condition)
    bridge.register_trigger(
        "queue",
        function_id,
        {
            "topic": topic,
            "_condition_path": condition_path,
        },
    )

    await flush_bridge_queue(bridge)
    await asyncio.sleep(0.5)

    await bridge.call("enqueue", {"topic": topic, "data": {"accept": False}})
    await bridge.call("enqueue", {"topic": topic, "data": {"accept": True}})
    await asyncio.sleep(2.0)

    assert len(handler_calls) == 1
    assert handler_calls[0] == {"accept": True}
