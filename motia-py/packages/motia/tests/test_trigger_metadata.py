"""Tests for TriggerMetadata with state and stream types."""
from motia.types import TriggerMetadata


def test_trigger_metadata_state_type():
    """Test TriggerMetadata supports state type."""
    meta = TriggerMetadata(type="state", index=0)
    assert meta.type == "state"
    assert meta.index == 0


def test_trigger_metadata_stream_type():
    """Test TriggerMetadata supports stream type."""
    meta = TriggerMetadata(
        type="stream",
        index=0,
        stream_name="todos",
        group_id="inbox",
        item_id="item-123",
    )
    assert meta.type == "stream"
    assert meta.stream_name == "todos"
    assert meta.group_id == "inbox"
    assert meta.item_id == "item-123"


def test_trigger_metadata_stream_minimal():
    """Test TriggerMetadata stream with only required fields."""
    meta = TriggerMetadata(type="stream", stream_name="orders")
    assert meta.type == "stream"
    assert meta.stream_name == "orders"
    assert meta.group_id is None
    assert meta.item_id is None
