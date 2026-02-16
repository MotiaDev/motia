"""Tests for stream trigger registration in step wrapper."""

from unittest.mock import MagicMock, patch

import pytest

from motia.types import StepConfig, StreamTrigger, stream


@pytest.fixture
def mock_bridge():
    """Create mock bridge."""
    bridge = MagicMock()
    bridge.register_function = MagicMock()
    bridge.register_trigger = MagicMock()
    return bridge


def test_is_stream_trigger():
    """Test is_stream_trigger type guard."""
    from motia.step_wrapper import is_stream_trigger

    stream_trigger = StreamTrigger(type="stream", stream_name="todos")
    assert is_stream_trigger(stream_trigger) is True

    from motia.types import QueueTrigger

    queue_trigger = QueueTrigger(type="queue", subscribes=["test"])
    assert is_stream_trigger(queue_trigger) is False


def test_stream_trigger_registration(mock_bridge):
    """Test stream trigger registers correctly with bridge."""
    from motia.step_wrapper import register_step

    config = StepConfig(
        name="test-stream-step",
        triggers=[stream("todos")],
    )

    async def handler(input, ctx):
        pass

    with patch("motia.step_wrapper.bridge", mock_bridge):
        register_step(config, "steps/test.step.py", handler)

    # Verify trigger was registered
    mock_bridge.register_trigger.assert_called()
    call_args = mock_bridge.register_trigger.call_args
    assert call_args[1]["type"] == "stream"
    assert call_args[1]["config"]["stream_name"] == "todos"


def test_stream_trigger_with_filters_registration(mock_bridge):
    """Test stream trigger with filters registers correctly."""
    from motia.step_wrapper import register_step

    config = StepConfig(
        name="test-stream-filters",
        triggers=[stream("orders", group_id="pending", item_id="order-123")],
    )

    async def handler(input, ctx):
        pass

    with patch("motia.step_wrapper.bridge", mock_bridge):
        register_step(config, "steps/test.step.py", handler)

    call_args = mock_bridge.register_trigger.call_args
    trigger_config = call_args[1]["config"]
    assert trigger_config["stream_name"] == "orders"
    assert trigger_config["group_id"] == "pending"
    assert trigger_config["item_id"] == "order-123"


def test_stream_trigger_with_condition_registers_condition_function(mock_bridge):
    """Test stream trigger with condition registers condition function."""
    from motia.step_wrapper import register_step

    def my_condition(input, ctx):
        return input.event.type == "update"

    config = StepConfig(
        name="test-stream-condition",
        triggers=[stream("todos", condition=my_condition)],
    )

    async def handler(input, ctx):
        pass

    with patch("motia.step_wrapper.bridge", mock_bridge):
        register_step(config, "steps/test.step.py", handler)

    # Should register both the handler function and the condition function
    assert mock_bridge.register_function.call_count >= 2

    # Find the condition registration
    condition_registered = False
    for call in mock_bridge.register_function.call_args_list:
        if "conditions:" in str(call):
            condition_registered = True
            break
    assert condition_registered, "Condition function should be registered"
