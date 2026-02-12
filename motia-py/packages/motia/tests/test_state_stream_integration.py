# motia/tests/test_state_stream_integration.py
"""Integration tests for state and stream triggers."""
from unittest.mock import AsyncMock, MagicMock

import pytest

from motia import api, event
from motia.types import FlowContext, StateTriggerInput, StepConfig, StreamTriggerInput, TriggerMetadata, state, stream


class TestStateTriggerIntegration:
    """Integration tests for state triggers."""

    def test_full_state_trigger_flow(self):
        """Test complete state trigger configuration and context."""

        # Create step config with state trigger
        def condition(input, ctx):
            return input.group_id == "users" and input.new_value is not None

        config = StepConfig(
            name="user-state-handler",
            triggers=[state(condition=condition)],
            emits=["user.updated"],
        )

        # Verify config structure
        assert len(config.triggers) == 1
        assert config.triggers[0].type == "state"
        assert config.triggers[0].condition is condition

        # Create context for state trigger
        ctx = FlowContext(
            emit=AsyncMock(),
            trace_id="test-trace",
            state=MagicMock(),
            logger=MagicMock(),
            streams={},
            trigger=TriggerMetadata(type="state", index=0),
            _input=None,
        )

        assert ctx.is_state() is True
        assert ctx.is_event() is False
        assert ctx.is_stream() is False

    def test_state_trigger_input_parsing(self):
        """Test StateTriggerInput parses camelCase from engine."""
        # Simulate input from engine (camelCase)
        engine_input = {
            "type": "state",
            "groupId": "users",
            "itemId": "user-123",
            "oldValue": {"name": "Alice"},
            "newValue": {"name": "Bob"},
        }

        trigger_input = StateTriggerInput(**engine_input)
        assert trigger_input.group_id == "users"
        assert trigger_input.item_id == "user-123"
        assert trigger_input.old_value == {"name": "Alice"}
        assert trigger_input.new_value == {"name": "Bob"}


class TestStreamTriggerIntegration:
    """Integration tests for stream triggers."""

    def test_full_stream_trigger_flow(self):
        """Test complete stream trigger configuration and context."""

        # Create step config with stream trigger
        def condition(input, ctx):
            return input.event.type == "update"

        config = StepConfig(
            name="todo-stream-handler",
            triggers=[stream("todos", group_id="inbox", condition=condition)],
            emits=["todo.processed"],
        )

        # Verify config structure
        assert len(config.triggers) == 1
        trigger = config.triggers[0]
        assert trigger.type == "stream"
        assert trigger.stream_name == "todos"
        assert trigger.group_id == "inbox"
        assert trigger.condition is condition

        # Create context for stream trigger
        ctx = FlowContext(
            emit=AsyncMock(),
            trace_id="test-trace",
            state=MagicMock(),
            logger=MagicMock(),
            streams={},
            trigger=TriggerMetadata(
                type="stream",
                index=0,
                stream_name="todos",
                group_id="inbox",
            ),
            _input=None,
        )

        assert ctx.is_stream() is True
        assert ctx.is_state() is False
        assert ctx.is_event() is False

    def test_stream_trigger_input_parsing(self):
        """Test StreamTriggerInput parses camelCase from engine."""
        # Simulate input from engine (camelCase)
        engine_input = {
            "type": "stream",
            "timestamp": 1234567890,
            "streamName": "todos",
            "groupId": "inbox",
            "id": "item-123",
            "event": {"type": "create", "data": {"title": "Test"}},
        }

        trigger_input = StreamTriggerInput(**engine_input)
        assert trigger_input.stream_name == "todos"
        assert trigger_input.group_id == "inbox"
        assert trigger_input.id == "item-123"
        assert trigger_input.event.type == "create"
        assert trigger_input.event.data == {"title": "Test"}


class TestMixedTriggers:
    """Test steps with multiple trigger types."""

    @pytest.mark.asyncio
    async def test_match_dispatches_correctly(self):
        """Test match() dispatches to correct handler type."""
        # State context
        state_ctx = FlowContext(
            emit=AsyncMock(),
            trace_id="test",
            state=MagicMock(),
            logger=MagicMock(),
            streams={},
            trigger=TriggerMetadata(type="state"),
            _input={"group_id": "test"},
        )

        state_handler = AsyncMock(return_value="state")
        stream_handler = AsyncMock(return_value="stream")
        event_handler = AsyncMock(return_value="event")

        result = await state_ctx.match(
            {
                "state": state_handler,
                "stream": stream_handler,
                "event": event_handler,
            }
        )

        assert result == "state"
        state_handler.assert_called_once()
        stream_handler.assert_not_called()
        event_handler.assert_not_called()

        # Stream context
        stream_ctx = FlowContext(
            emit=AsyncMock(),
            trace_id="test",
            state=MagicMock(),
            logger=MagicMock(),
            streams={},
            trigger=TriggerMetadata(type="stream", stream_name="test"),
            _input={"stream_name": "test"},
        )

        state_handler.reset_mock()
        stream_handler.reset_mock()

        result = await stream_ctx.match(
            {
                "state": state_handler,
                "stream": stream_handler,
                "event": event_handler,
            }
        )

        assert result == "stream"
        stream_handler.assert_called_once()
        state_handler.assert_not_called()

    def test_step_config_with_all_trigger_types(self):
        """Test StepConfig can combine all trigger types."""
        config = StepConfig(
            name="multi-trigger-step",
            triggers=[
                event("user.created"),
                api("POST", "/users"),
                state(),
                stream("users"),
            ],
            emits=["user.processed"],
        )

        assert len(config.triggers) == 4
        assert config.triggers[0].type == "queue"
        assert config.triggers[1].type == "api"
        assert config.triggers[2].type == "state"
        assert config.triggers[3].type == "stream"
