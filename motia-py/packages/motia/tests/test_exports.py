# motia/tests/test_exports.py
"""Tests for package exports."""


def test_state_trigger_exports():
    """Test state trigger types are exported."""
    from motia import StateTrigger, StateTriggerInput, state

    assert StateTrigger is not None
    assert StateTriggerInput is not None
    assert state is not None


def test_stream_trigger_exports():
    """Test stream trigger types are exported."""
    from motia import StreamEvent, StreamTrigger, StreamTriggerInput, stream

    assert StreamTrigger is not None
    assert StreamTriggerInput is not None
    assert StreamEvent is not None
    assert stream is not None


def test_tracing_exports():
    """Test tracing utilities are exported."""
    from motia import tracing

    assert hasattr(tracing, "HAS_OTEL")
    assert hasattr(tracing, "get_tracer")
    assert hasattr(tracing, "instrument_bridge")
