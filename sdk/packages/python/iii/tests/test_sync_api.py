"""Tests for the synchronous public API."""

import json
import threading
import time
from types import SimpleNamespace
from typing import Any

import pytest

import iii.iii as iii_module
from iii import III, InitOptions


class FakeWebSocket:
    def __init__(self) -> None:
        self.sent: list[dict[str, Any]] = []
        self.state = SimpleNamespace(name="OPEN")

    async def send(self, payload: str) -> None:
        self.sent.append(json.loads(payload))

    async def close(self) -> None:
        self.state = SimpleNamespace(name="CLOSED")

    def __aiter__(self) -> "FakeWebSocket":
        return self

    async def __anext__(self) -> Any:
        raise StopAsyncIteration


def _patch_ws(monkeypatch: pytest.MonkeyPatch) -> FakeWebSocket:
    ws = FakeWebSocket()

    async def fake_connect(_: str) -> FakeWebSocket:
        return ws

    monkeypatch.setattr(iii_module.websockets, "connect", fake_connect)
    monkeypatch.setattr("iii.telemetry.init_otel", lambda **kwargs: None)
    monkeypatch.setattr("iii.telemetry.attach_event_loop", lambda loop: None)
    return ws


def test_iii_creates_background_thread() -> None:
    """III.__init__ should start a daemon background thread with an event loop."""
    client = III("ws://fake", InitOptions())
    assert hasattr(client, "_loop")
    assert hasattr(client, "_thread")
    assert client._thread.is_alive()
    assert client._thread.daemon is True
    # Cleanup
    client._loop.call_soon_threadsafe(client._loop.stop)
    client._thread.join(timeout=2)


def test_connect_is_sync(monkeypatch: pytest.MonkeyPatch) -> None:
    """connect() should be a synchronous call (no await needed)."""
    ws = _patch_ws(monkeypatch)
    client = III("ws://fake", InitOptions())
    client._register_worker_metadata = lambda: None

    result = client.connect()
    assert result is None
    assert client.get_connection_state() == "connected"

    client.shutdown()


def test_shutdown_is_sync(monkeypatch: pytest.MonkeyPatch) -> None:
    """shutdown() should be a synchronous call."""
    _patch_ws(monkeypatch)
    client = III("ws://fake", InitOptions())
    client._register_worker_metadata = lambda: None
    client.connect()

    result = client.shutdown()
    assert result is None
    assert client.get_connection_state() == "disconnected"


def test_background_thread_stops_on_shutdown(monkeypatch: pytest.MonkeyPatch) -> None:
    """After shutdown(), the background thread should stop."""
    _patch_ws(monkeypatch)
    client = III("ws://fake", InitOptions())
    client._register_worker_metadata = lambda: None
    client.connect()

    thread = client._thread
    client.shutdown()

    assert not thread.is_alive()
