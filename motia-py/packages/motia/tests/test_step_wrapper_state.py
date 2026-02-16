"""Tests for state trigger registration in step wrapper."""

from unittest.mock import MagicMock, patch

import pytest

from motia.types import StateTrigger, StepConfig, state


@pytest.fixture
def mock_bridge():
    """Create mock bridge."""
    bridge = MagicMock()
    bridge.register_function = MagicMock()
    bridge.register_trigger = MagicMock()
    return bridge


def test_is_state_trigger():
    """Test is_state_trigger type guard."""
    from motia.step_wrapper import is_state_trigger

    state_trigger = StateTrigger(type="state")
    assert is_state_trigger(state_trigger) is True

    from motia.types import QueueTrigger

    queue_trigger = QueueTrigger(type="queue", subscribes=["test"])
    assert is_state_trigger(queue_trigger) is False


def test_state_trigger_registration(mock_bridge):
    """Test state trigger registers correctly with bridge."""
    from motia.step_wrapper import register_step

    config = StepConfig(
        name="test-state-step",
        triggers=[state()],
    )

    async def handler(input, ctx):
        pass

    with patch("motia.step_wrapper.bridge", mock_bridge):
        register_step(config, "steps/test.step.py", handler)

    # Verify trigger was registered
    mock_bridge.register_trigger.assert_called()
    call_args = mock_bridge.register_trigger.call_args
    assert call_args[1]["type"] == "state"


def test_state_trigger_with_condition_registers_condition_function(mock_bridge):
    """Test state trigger with condition registers condition function."""
    from motia.step_wrapper import register_step

    def my_condition(input, ctx):
        return input.group_id == "users"

    config = StepConfig(
        name="test-state-condition",
        triggers=[state(condition=my_condition)],
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
