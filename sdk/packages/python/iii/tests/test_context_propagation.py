"""Tests for W3C traceparent propagation through _handle_invoke."""
import pytest
from unittest.mock import AsyncMock, patch

from iii.iii import III, InitOptions
from iii.telemetry import init_otel, shutdown_otel
from iii.telemetry_types import OtelConfig


@pytest.fixture(autouse=True)
def otel_setup():
    init_otel(OtelConfig(enabled=True))
    yield
    shutdown_otel()
    # Reset all OTel global singletons so tests don't bleed state
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


@pytest.mark.asyncio
async def test_handle_invoke_restores_trace_context_from_traceparent():
    """Handler should run inside the parent OTel context extracted from traceparent."""
    from opentelemetry import trace

    captured_trace_id: list[int] = []

    async def handler(data):
        span = trace.get_current_span()
        ctx = span.get_span_context()
        if ctx.is_valid:
            captured_trace_id.append(ctx.trace_id)
        return {"ok": True}

    client = III(address="ws://localhost:9999", options=InitOptions(worker_name="test"))
    client.register_function("test::fn", handler)

    # Real W3C traceparent: trace_id = 4bf92f3577b34da6a3ce929d0e0e4736
    fake_traceparent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"

    # Use a non-None invocation_id with mocked _send so _invoke_with_context is awaited
    with patch.object(client, "_send", new_callable=AsyncMock):
        await client._handle_invoke(
            invocation_id="test-invocation-id",
            path="test::fn",
            data={},
            traceparent=fake_traceparent,
        )

    expected_trace_id = 0x4bf92f3577b34da6a3ce929d0e0e4736
    assert captured_trace_id, "handler did not capture an active span"
    assert captured_trace_id[0] == expected_trace_id


@pytest.mark.asyncio
async def test_handle_invoke_without_traceparent_runs_normally():
    """Handler should run fine when no traceparent is provided."""
    called: list[bool] = []

    async def handler(data):
        called.append(True)
        return {"ok": True}

    client = III(address="ws://localhost:9999", options=InitOptions(worker_name="test"))
    client.register_function("test::fn", handler)

    with patch.object(client, "_send", new_callable=AsyncMock):
        await client._handle_invoke(
            invocation_id="test-invocation-id",
            path="test::fn",
            data={},
            traceparent=None,
        )

    assert called
