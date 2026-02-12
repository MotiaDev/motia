"""Tests for OpenTelemetry instrumentation of state operations."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from opentelemetry.trace import StatusCode

from motia.state import StateManager


@pytest.fixture
def otel_exporter():
    """Set up an in-memory span exporter with a fresh TracerProvider."""
    trace._TRACER_PROVIDER_SET_ONCE = trace.Once()  # type: ignore[attr-defined]
    trace._TRACER_PROVIDER = None  # type: ignore[attr-defined]
    exporter = InMemorySpanExporter()
    provider = TracerProvider()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    trace.set_tracer_provider(provider)
    yield exporter
    exporter.clear()
    provider.shutdown()


@pytest.fixture
def mock_bridge():
    """Create a mock bridge."""
    bridge = MagicMock()
    bridge.call = AsyncMock()
    return bridge


@pytest.mark.asyncio
async def test_state_get_creates_span(otel_exporter, mock_bridge):
    """state.get() should create a span named 'state.get' with correct attributes."""
    mock_bridge.call.return_value = {"key": "value"}
    sm = StateManager()

    with patch.object(sm, "_get_bridge", return_value=mock_bridge):
        result = await sm.get("group1", "item1")

    assert result == {"key": "value"}

    spans = otel_exporter.get_finished_spans()
    state_spans = [s for s in spans if s.name == "state.get"]
    assert len(state_spans) == 1

    span = state_spans[0]
    assert span.attributes["motia.state.group_id"] == "group1"
    assert span.attributes["motia.state.item_id"] == "item1"
    assert span.status.status_code == StatusCode.OK


@pytest.mark.asyncio
async def test_state_set_creates_span(otel_exporter, mock_bridge):
    """state.set() should create a span named 'state.set' with correct attributes."""
    mock_bridge.call.return_value = {"key": "value"}
    sm = StateManager()

    with patch.object(sm, "_get_bridge", return_value=mock_bridge):
        result = await sm.set("group1", "item1", {"key": "value"})

    assert result == {"key": "value"}

    spans = otel_exporter.get_finished_spans()
    state_spans = [s for s in spans if s.name == "state.set"]
    assert len(state_spans) == 1

    span = state_spans[0]
    assert span.attributes["motia.state.group_id"] == "group1"
    assert span.attributes["motia.state.item_id"] == "item1"
    assert span.status.status_code == StatusCode.OK


@pytest.mark.asyncio
async def test_state_delete_creates_span(otel_exporter, mock_bridge):
    """state.delete() should create a span named 'state.delete' with correct attributes."""
    mock_bridge.call.return_value = None
    sm = StateManager()

    with patch.object(sm, "_get_bridge", return_value=mock_bridge):
        await sm.delete("group1", "item1")

    spans = otel_exporter.get_finished_spans()
    state_spans = [s for s in spans if s.name == "state.delete"]
    assert len(state_spans) == 1

    span = state_spans[0]
    assert span.attributes["motia.state.group_id"] == "group1"
    assert span.attributes["motia.state.item_id"] == "item1"
    assert span.status.status_code == StatusCode.OK


@pytest.mark.asyncio
async def test_state_get_group_creates_span(otel_exporter, mock_bridge):
    """state.get_group() should create a span named 'state.list' with correct attributes."""
    mock_bridge.call.return_value = [{"id": "a"}, {"id": "b"}]
    sm = StateManager()

    with patch.object(sm, "_get_bridge", return_value=mock_bridge):
        result = await sm.get_group("group1")

    assert result == [{"id": "a"}, {"id": "b"}]

    spans = otel_exporter.get_finished_spans()
    state_spans = [s for s in spans if s.name == "state.list"]
    assert len(state_spans) == 1

    span = state_spans[0]
    assert span.attributes["motia.state.group_id"] == "group1"
    assert span.status.status_code == StatusCode.OK


@pytest.mark.asyncio
async def test_state_list_groups_creates_span(otel_exporter, mock_bridge):
    """state.list_groups() should create a span named 'state.list_groups'."""
    mock_bridge.call.return_value = ["group1", "group2"]
    sm = StateManager()

    with patch.object(sm, "_get_bridge", return_value=mock_bridge):
        result = await sm.list_groups()

    assert result == ["group1", "group2"]

    spans = otel_exporter.get_finished_spans()
    state_spans = [s for s in spans if s.name == "state.list_groups"]
    assert len(state_spans) == 1

    span = state_spans[0]
    assert span.status.status_code == StatusCode.OK


@pytest.mark.asyncio
async def test_state_clear_creates_span(otel_exporter, mock_bridge):
    """state.clear() should create a span named 'state.clear' with correct attributes."""
    mock_bridge.call.return_value = [{"id": "item1"}, {"id": "item2"}]
    sm = StateManager()

    with patch.object(sm, "_get_bridge", return_value=mock_bridge):
        await sm.clear("group1")

    spans = otel_exporter.get_finished_spans()
    clear_spans = [s for s in spans if s.name == "state.clear"]
    assert len(clear_spans) == 1

    span = clear_spans[0]
    assert span.attributes["motia.state.group_id"] == "group1"
    assert span.status.status_code == StatusCode.OK
