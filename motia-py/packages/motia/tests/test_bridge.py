# motia/tests/test_bridge.py
"""Integration tests for bridge connection and function registration."""

import asyncio

import pytest

from tests.conftest import flush_bridge_queue

pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_bridge_connects_successfully(bridge):
    """Test that bridge connects to III engine."""
    # If we get here, the bridge fixture connected successfully
    assert bridge is not None
    assert bridge._ws is not None


@pytest.mark.asyncio
async def test_register_and_invoke_function(bridge):
    """Test registering a function and invoking it."""
    received_data = None

    async def echo_handler(data):
        nonlocal received_data
        received_data = data
        return {"echoed": data}

    bridge.register_function("test.echo", echo_handler)

    await flush_bridge_queue(bridge)

    # Give time for registration to propagate
    await asyncio.sleep(0.3)

    # Invoke the function
    result = await bridge.call("test.echo", {"message": "hello"})

    # Check that the echoed data contains our message
    # (III engine may inject _caller_worker_id into the data)
    assert "echoed" in result
    assert result["echoed"]["message"] == "hello"
    assert received_data["message"] == "hello"


@pytest.mark.asyncio
async def test_invoke_function_async_fire_and_forget(bridge):
    """Test fire-and-forget function invocation."""
    received = asyncio.Event()
    received_data = None

    async def receiver(data):
        nonlocal received_data
        received_data = data
        received.set()
        return {}

    bridge.register_function("test.receiver", receiver)

    await flush_bridge_queue(bridge)

    await asyncio.sleep(0.3)

    # Fire and forget
    bridge.call_void("test.receiver", {"value": 42})

    # Wait for it to be received
    await asyncio.wait_for(received.wait(), timeout=5.0)

    # Check that the received data contains our value
    # (III engine may inject _caller_worker_id into the data)
    assert received_data["value"] == 42


@pytest.mark.asyncio
async def test_invoke_nonexistent_function_raises(bridge):
    """Test that invoking a non-existent function raises an error."""
    with pytest.raises(Exception):
        await bridge.call("nonexistent.function", {}, timeout=2.0)
