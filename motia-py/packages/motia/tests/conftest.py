# motia/tests/conftest.py
"""Pytest configuration and fixtures for integration tests.

These tests require a running III engine instance.

In CI, the engine is started automatically via the setup-iii-engine GitHub Action.

Locally, start the engine manually:

    iii --config tests/fixtures/config-test.yaml

Or override the ports via environment variables:

    TEST_ENGINE_PORT=49199 TEST_API_PORT=3199 pytest
"""

import asyncio
import json
import os
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from iii import III


async def flush_bridge_queue(bridge: III) -> None:
    """Flush the bridge queue to ensure all messages are sent.

    This is needed because register_function uses _enqueue which adds to a queue
    that is only flushed on initial connection, not on subsequent calls.
    """
    while bridge._queue and bridge._ws:
        await bridge._ws.send(json.dumps(bridge._queue.pop(0)))


# Test ports - configurable via environment, defaults match tests/fixtures/config-test.yaml
TEST_ENGINE_PORT = int(os.environ.get("TEST_ENGINE_PORT", "49199"))
TEST_API_PORT = int(os.environ.get("TEST_API_PORT", "3199"))
TEST_ENGINE_URL = f"ws://localhost:{TEST_ENGINE_PORT}"
TEST_API_URL = f"http://localhost:{TEST_API_PORT}"


@pytest_asyncio.fixture
async def bridge() -> AsyncGenerator[III, None]:
    """Create a connected bridge instance for testing.

    Requires III engine to be running on TEST_ENGINE_URL.
    """
    bridge_instance = III(TEST_ENGINE_URL)
    await bridge_instance.connect()

    # Give the bridge time to fully connect
    await asyncio.sleep(0.1)

    yield bridge_instance

    await bridge_instance.shutdown()


@pytest.fixture
def api_url() -> str:
    """Return the test API URL."""
    return TEST_API_URL


@pytest.fixture
def engine_url() -> str:
    """Return the test engine WebSocket URL."""
    return TEST_ENGINE_URL
