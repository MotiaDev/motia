import asyncio
import json
from types import SimpleNamespace
from typing import Any

import pytest

import iii.iii as iii_module
from iii import III


@pytest.fixture(autouse=True)
def reset_otel():
    yield
    # III.connect() calls init_otel() which sets global providers;
    # reset them so subsequent test files start with a clean slate.
    try:
        from iii.telemetry import shutdown_otel
        shutdown_otel()
    except Exception:
        pass
    try:
        import opentelemetry._logs._internal as _li
        _li._LOGGER_PROVIDER = None
        _li._LOGGER_PROVIDER_SET_ONCE._done = False
    except Exception:
        pass
    try:
        import opentelemetry.trace._internal as _ti
        _ti._TRACER_PROVIDER = None
        _ti._TRACER_PROVIDER_SET_ONCE._done = False
    except Exception:
        pass
    try:
        import opentelemetry.metrics._internal as _mi
        _mi._METER_PROVIDER = None
        _mi._METER_PROVIDER_SET_ONCE._done = False
    except Exception:
        pass


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


@pytest.mark.asyncio
async def test_preconnect_registration_sent_once(monkeypatch: pytest.MonkeyPatch) -> None:
    ws = FakeWebSocket()
    connect_calls = 0

    async def fake_connect(_addr: str) -> FakeWebSocket:
        nonlocal connect_calls
        connect_calls += 1
        return ws

    monkeypatch.setattr(iii_module.websockets, "connect", fake_connect)
    monkeypatch.setattr("iii.telemetry.init_otel", lambda **kwargs: None)
    monkeypatch.setattr("iii.telemetry.attach_event_loop", lambda loop: None)

    client = III("ws://fake")
    client._register_worker_metadata = lambda: None

    async def handler(data: Any) -> Any:
        return data

    client.register_function("demo.fn", handler)
    client.register_trigger("cron", "demo.fn", {"cron": "* * * * * *"})

    assert client._queue == []

    await client.connect()
    await asyncio.sleep(0.01)
    await client.shutdown()

    reg_fn = [m for m in ws.sent if m.get("type") == "registerfunction" and m.get("id") == "demo.fn"]
    reg_trigger = [m for m in ws.sent if m.get("type") == "registertrigger" and m.get("function_id") == "demo.fn"]

    assert connect_calls == 1
    assert len(reg_fn) == 1, ws.sent
    assert len(reg_trigger) == 1, ws.sent


@pytest.mark.asyncio
async def test_reconnect_replays_durable_state_once_per_connection(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    sockets: list[FakeWebSocket] = []

    async def fake_connect(_addr: str) -> FakeWebSocket:
        ws = FakeWebSocket()
        sockets.append(ws)
        return ws

    monkeypatch.setattr(iii_module.websockets, "connect", fake_connect)
    monkeypatch.setattr("iii.telemetry.init_otel", lambda **kwargs: None)
    monkeypatch.setattr("iii.telemetry.attach_event_loop", lambda loop: None)

    client = III("ws://fake")
    client._register_worker_metadata = lambda: None

    async def handler(data: Any) -> Any:
        return data

    client.register_function("demo.fn", handler)
    client.register_trigger("cron", "demo.fn", {"cron": "* * * * * *"})

    await client.connect()
    await asyncio.sleep(0.01)

    first_ws = client._ws
    assert first_ws is not None
    await first_ws.close()
    client._ws = None

    await client._do_connect()
    await asyncio.sleep(0.01)
    await client.shutdown()

    total_fn = sum(
        1 for ws in sockets for m in ws.sent if m.get("type") == "registerfunction" and m.get("id") == "demo.fn"
    )
    total_trigger = sum(
        1
        for ws in sockets
        for m in ws.sent
        if m.get("type") == "registertrigger" and m.get("function_id") == "demo.fn"
    )

    assert total_fn == 2
    assert total_trigger == 2


@pytest.mark.asyncio
async def test_call_void_queued_while_disconnected_flushes_after_connect(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    ws = FakeWebSocket()

    async def fake_connect(_addr: str) -> FakeWebSocket:
        return ws

    monkeypatch.setattr(iii_module.websockets, "connect", fake_connect)
    monkeypatch.setattr("iii.telemetry.init_otel", lambda **kwargs: None)
    monkeypatch.setattr("iii.telemetry.attach_event_loop", lambda loop: None)

    client = III("ws://fake")
    client._register_worker_metadata = lambda: None

    client.call_void("demo.fire", {"x": 1})
    await asyncio.sleep(0)

    await client.connect()
    await asyncio.sleep(0.01)
    await client.shutdown()

    invoke = [m for m in ws.sent if m.get("type") == "invokefunction" and m.get("function_id") == "demo.fire"]
    assert len(invoke) == 1
