"""Integration tests for cron trigger invocation."""

import asyncio
import time

import pytest

from tests.conftest import flush_bridge_queue, wait_for_registration


@pytest.mark.asyncio
async def test_manual_cron_fire_invokes_registered_handler(bridge):
    """Manual cron fire invokes registered handler."""
    function_id = f"test.cron.basic.{int(time.time() * 1000)}"
    invoked = []

    async def handler(data):
        invoked.append(True)

    bridge.register_function(function_id, handler)
    bridge.register_trigger("cron", function_id, {"expression": "0 0 31 2 *"})

    await flush_bridge_queue(bridge)
    await wait_for_registration(bridge, function_id)

    await bridge.call("engine::cron::fire", {"function_id": function_id})
    await asyncio.sleep(1.5)

    assert len(invoked) == 1


@pytest.mark.asyncio
async def test_handler_receives_data_from_cron_fire(bridge):
    """Handler receives data from cron manual fire."""
    function_id = f"test.cron.data.{int(time.time() * 1000)}"
    received = []

    async def handler(data):
        received.append(data)

    bridge.register_function(function_id, handler)
    bridge.register_trigger("cron", function_id, {"expression": "0 0 31 2 *"})

    await flush_bridge_queue(bridge)
    await wait_for_registration(bridge, function_id)

    await bridge.call("engine::cron::fire", {"function_id": function_id})
    await asyncio.sleep(1.5)

    assert len(received) == 1


@pytest.mark.asyncio
async def test_condition_function_filters_cron_invocations(bridge):
    """Condition function filters cron invocations."""
    function_id = f"test.cron.cond.{int(time.time() * 1000)}"
    condition_path = f"{function_id}::conditions::0"
    handler_calls = []
    condition_call_count = [0]

    async def handler(data):
        handler_calls.append(data)

    async def condition(input_data):
        condition_call_count[0] += 1
        return condition_call_count[0] > 1  # reject first, accept second

    bridge.register_function(function_id, handler)
    bridge.register_function(condition_path, condition)
    bridge.register_trigger(
        "cron",
        function_id,
        {
            "expression": "0 0 31 2 *",
            "_condition_path": condition_path,
        },
    )

    await flush_bridge_queue(bridge)
    await wait_for_registration(bridge, function_id)
    await wait_for_registration(bridge, condition_path)

    await bridge.call("engine::cron::fire", {"function_id": function_id})
    await asyncio.sleep(1.0)
    await bridge.call("engine::cron::fire", {"function_id": function_id})
    await asyncio.sleep(1.5)

    assert len(handler_calls) == 1


@pytest.mark.asyncio
async def test_multiple_cron_triggers_coexist_independently(bridge):
    """Multiple cron triggers coexist independently."""
    function_id1 = f"test.cron.multi1.{int(time.time() * 1000)}"
    function_id2 = f"test.cron.multi2.{int(time.time() * 1000)}"
    calls1 = []
    calls2 = []

    async def handler1(data):
        calls1.append(True)

    async def handler2(data):
        calls2.append(True)

    bridge.register_function(function_id1, handler1)
    bridge.register_function(function_id2, handler2)
    bridge.register_trigger("cron", function_id1, {"expression": "0 0 31 2 *"})
    bridge.register_trigger("cron", function_id2, {"expression": "0 0 30 2 *"})

    await flush_bridge_queue(bridge)
    await wait_for_registration(bridge, function_id1)
    await wait_for_registration(bridge, function_id2)

    # Fire only the first
    await bridge.call("engine::cron::fire", {"function_id": function_id1})
    await asyncio.sleep(1.5)

    assert len(calls1) == 1
    assert len(calls2) == 0
