import asyncio

import pytest

from iii import III, InitOptions, init


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.mark.anyio
async def test_init_schedules_connect(monkeypatch: pytest.MonkeyPatch) -> None:
    called = asyncio.Event()

    async def fake_connect(self: III) -> None:
        called.set()

    monkeypatch.setattr(III, "connect", fake_connect)

    client = init("ws://fake")
    assert isinstance(client, III)

    await asyncio.wait_for(called.wait(), timeout=0.2)


def test_init_requires_running_loop() -> None:
    with pytest.raises(RuntimeError, match="active asyncio event loop"):
        init("ws://fake")


@pytest.mark.anyio
async def test_connect_consumes_otel_from_init_options(monkeypatch: pytest.MonkeyPatch) -> None:
    import iii.telemetry as telemetry

    captured = {"config": None}

    def fake_init_otel(config=None, loop=None):
        captured["config"] = config

    def fake_attach_event_loop(loop):
        return None

    async def fake_do_connect(self: III) -> None:
        return None

    monkeypatch.setattr(telemetry, "init_otel", fake_init_otel)
    monkeypatch.setattr(telemetry, "attach_event_loop", fake_attach_event_loop)
    monkeypatch.setattr(III, "_do_connect", fake_do_connect)

    client = init(
        "ws://fake",
        InitOptions(otel={"enabled": True, "service_name": "iii-python-init-test"}),
    )

    # let scheduled connect task run
    await asyncio.sleep(0)

    assert isinstance(client, III)
    assert captured["config"] is not None
    assert getattr(captured["config"], "service_name", None) == "iii-python-init-test"
