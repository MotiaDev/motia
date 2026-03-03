"""Shared fixtures for III SDK integration tests."""

import asyncio
import os

import pytest
import pytest_asyncio

from iii import III

ENGINE_WS_URL = os.environ.get("III_BRIDGE_URL", "ws://localhost:49199")
ENGINE_HTTP_URL = os.environ.get("III_HTTP_URL", "http://localhost:3199")


@pytest_asyncio.fixture
async def iii_client():
    """Create and connect an III client, shut it down after the test."""
    client = III(ENGINE_WS_URL)
    await client.connect()
    await asyncio.sleep(0.3)
    yield client
    await client.shutdown()


@pytest.fixture
def engine_http_url():
    return ENGINE_HTTP_URL
