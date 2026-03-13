"""Integration tests for KV server operations."""

import random
import time

import pytest

from iii import III


def unique_key(prefix: str) -> str:
    return f"{prefix}_{int(time.time())}_{random.random():.10f}".replace(".", "_")


@pytest.mark.asyncio
async def test_set_and_get_value(iii_client: III):
    """Set a value in the KV store and retrieve it."""
    test_key = unique_key("test_key")
    test_value = {"name": "test", "value": 123}

    await iii_client.trigger({
        "function_id": "kv_server::set",
        "payload": {"index": "test_index", "key": test_key, "value": test_value},
    })

    result = await iii_client.trigger({
        "function_id": "kv_server::get",
        "payload": {"index": "test_index", "key": test_key},
    })

    assert result == test_value


@pytest.mark.asyncio
async def test_delete_value(iii_client: III):
    """Delete a value from the KV store."""
    test_key = unique_key("delete_key")

    await iii_client.trigger({
        "function_id": "kv_server::set",
        "payload": {"index": "test_index", "key": test_key, "value": {"data": "to_delete"}},
    })

    before_delete = await iii_client.trigger({
        "function_id": "kv_server::get",
        "payload": {"index": "test_index", "key": test_key},
    })
    assert before_delete is not None

    await iii_client.trigger({
        "function_id": "kv_server::delete",
        "payload": {"index": "test_index", "key": test_key},
    })

    after_delete = await iii_client.trigger({
        "function_id": "kv_server::get",
        "payload": {"index": "test_index", "key": test_key},
    })
    assert after_delete is None


@pytest.mark.asyncio
async def test_list_values_in_index(iii_client: III):
    """List all values in a KV index."""
    test_index = unique_key("list_index")

    for i in range(3):
        await iii_client.trigger({
            "function_id": "kv_server::set",
            "payload": {"index": test_index, "key": f"item_{i}", "value": {"id": i}},
        })

    result = await iii_client.trigger({
        "function_id": "kv_server::list",
        "payload": {"index": test_index},
    })

    assert isinstance(result, list)
    assert len(result) == 3


@pytest.mark.asyncio
async def test_get_non_existent_key(iii_client: III):
    """Getting a non-existent key returns None."""
    result = await iii_client.trigger({
        "function_id": "kv_server::get",
        "payload": {"index": "nonexistent_index", "key": "nonexistent_key"},
    })

    assert result is None
