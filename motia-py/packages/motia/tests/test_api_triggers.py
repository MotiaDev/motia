# motia/tests/test_api_triggers.py
"""Integration tests for API triggers (HTTP endpoints)."""

import asyncio

import httpx
import pytest

from tests.conftest import flush_bridge_queue


@pytest.mark.asyncio
async def test_api_trigger_get_endpoint(bridge, api_url):
    """Test registering a GET endpoint via API trigger."""

    async def get_handler(data):
        return {
            "status_code": 200,
            "body": {"message": "Hello from GET"},
        }

    bridge.register_function("test.api.get", get_handler)
    bridge.register_trigger(
        "api",
        "test.api.get",
        {
            "api_path": "test/hello",
            "http_method": "GET",
        },
    )

    await flush_bridge_queue(bridge)
    await asyncio.sleep(0.3)

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{api_url}/test/hello")

    assert response.status_code == 200
    assert response.json() == {"message": "Hello from GET"}


@pytest.mark.asyncio
async def test_api_trigger_post_with_body(bridge, api_url):
    """Test POST endpoint with request body."""

    async def post_handler(data):
        body = data.get("body", {})
        return {
            "status_code": 201,
            "body": {"received": body, "created": True},
        }

    bridge.register_function("test.api.post", post_handler)
    bridge.register_trigger(
        "api",
        "test.api.post",
        {
            "api_path": "test/items",
            "http_method": "POST",
        },
    )

    await flush_bridge_queue(bridge)
    await asyncio.sleep(0.3)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{api_url}/test/items",
            json={"name": "test item", "value": 123},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["created"] is True
    assert data["received"]["name"] == "test item"


@pytest.mark.asyncio
async def test_api_trigger_path_params(bridge, api_url):
    """Test endpoint with path parameters."""

    async def get_by_id_handler(data):
        path_params = data.get("path_params", {})
        return {
            "status_code": 200,
            "body": {"id": path_params.get("id")},
        }

    bridge.register_function("test.api.getById", get_by_id_handler)
    bridge.register_trigger(
        "api",
        "test.api.getById",
        {
            "api_path": "test/items/:id",
            "http_method": "GET",
        },
    )

    await flush_bridge_queue(bridge)
    await asyncio.sleep(0.3)

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{api_url}/test/items/abc123")

    assert response.status_code == 200
    assert response.json() == {"id": "abc123"}


@pytest.mark.asyncio
async def test_api_trigger_query_params(bridge, api_url):
    """Test endpoint with query parameters."""

    async def search_handler(data):
        query_params = data.get("query_params", {})
        return {
            "status_code": 200,
            "body": {"query": query_params.get("q"), "limit": query_params.get("limit")},
        }

    bridge.register_function("test.api.search", search_handler)
    bridge.register_trigger(
        "api",
        "test.api.search",
        {
            "api_path": "test/search",
            "http_method": "GET",
        },
    )

    await flush_bridge_queue(bridge)
    await asyncio.sleep(0.3)

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{api_url}/test/search?q=hello&limit=10")

    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "hello"
    assert data["limit"] == "10"


@pytest.mark.asyncio
async def test_api_trigger_custom_status_code(bridge, api_url):
    """Test returning custom status codes."""

    async def not_found_handler(data):
        return {
            "status_code": 404,
            "body": {"error": "Not found"},
        }

    bridge.register_function("test.api.notfound", not_found_handler)
    bridge.register_trigger(
        "api",
        "test.api.notfound",
        {
            "api_path": "test/missing",
            "http_method": "GET",
        },
    )

    await flush_bridge_queue(bridge)
    await asyncio.sleep(0.3)

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{api_url}/test/missing")

    assert response.status_code == 404
    assert response.json() == {"error": "Not found"}
