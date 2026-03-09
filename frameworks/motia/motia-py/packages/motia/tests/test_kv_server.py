# motia/tests/test_kv_server.py
"""Integration tests for KV Server operations."""

import uuid

import pytest

pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_kv_set_and_get(bridge):
    """Test setting and getting a value."""
    test_key = f"test_key_{uuid.uuid4()}"
    test_value = {"name": "test", "value": 123}

    # Set value
    await bridge.call(
        "kv_server::set",
        {
            "index": "test_index",
            "key": test_key,
            "value": test_value,
        },
    )

    # Get value
    result = await bridge.call(
        "kv_server::get",
        {
            "index": "test_index",
            "key": test_key,
        },
    )

    assert result == test_value


@pytest.mark.asyncio
async def test_kv_delete(bridge):
    """Test deleting a value."""
    test_key = f"delete_key_{uuid.uuid4()}"

    # Set value
    await bridge.call(
        "kv_server::set",
        {
            "index": "test_index",
            "key": test_key,
            "value": {"data": "to_delete"},
        },
    )

    # Verify it exists
    result = await bridge.call(
        "kv_server::get",
        {
            "index": "test_index",
            "key": test_key,
        },
    )
    assert result is not None

    # Delete
    await bridge.call(
        "kv_server::delete",
        {
            "index": "test_index",
            "key": test_key,
        },
    )

    # Verify it's gone
    result = await bridge.call(
        "kv_server::get",
        {
            "index": "test_index",
            "key": test_key,
        },
    )
    assert result is None


@pytest.mark.asyncio
async def test_kv_list(bridge):
    """Test listing all values in an index."""
    test_index = f"list_index_{uuid.uuid4()}"

    # Set multiple values
    for i in range(3):
        await bridge.call(
            "kv_server::set",
            {
                "index": test_index,
                "key": f"item_{i}",
                "value": {"id": i},
            },
        )

    # List all
    result = await bridge.call(
        "kv_server::list",
        {
            "index": test_index,
        },
    )

    assert isinstance(result, list)
    assert len(result) == 3


@pytest.mark.asyncio
async def test_kv_get_nonexistent_key(bridge):
    """Test getting a non-existent key returns None."""
    result = await bridge.call(
        "kv_server::get",
        {
            "index": "nonexistent_index",
            "key": "nonexistent_key",
        },
    )

    assert result is None
