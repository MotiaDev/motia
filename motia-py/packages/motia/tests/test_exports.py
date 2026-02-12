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
    from motia import StreamTrigger, StreamTriggerInput, StreamEvent, stream

    assert StreamTrigger is not None
    assert StreamTriggerInput is not None
    assert StreamEvent is not None
    assert stream is not None
