"""Compatibility tests for event/queue engine contract mapping."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from motia.runtime import Motia
from motia.triggers import api, queue
from motia.types import ApiRequest, ApiResponse, FlowContext, StepConfig


@pytest.fixture
def mock_bridge() -> MagicMock:
    """Create a bridge mock with async call support."""
    bridge = MagicMock()
    bridge.register_function = MagicMock()
    bridge.register_trigger = MagicMock()
    bridge.call = AsyncMock()
    return bridge


def test_event_trigger_registers_as_queue_trigger(mock_bridge: MagicMock) -> None:
    """Event trigger should map to queue trigger type for engine registration."""
    from motia.step_wrapper import register_step

    config = StepConfig(
        name="event-trigger-compat",
        triggers=[queue("orders.created")],
    )

    async def handler(input_data: object, ctx: FlowContext[object]) -> None:
        _ = (input_data, ctx)

    with patch("motia.step_wrapper.bridge", mock_bridge):
        register_step(config, "steps/test.step.py", handler)

    call_args = mock_bridge.register_trigger.call_args
    assert call_args[1]["trigger_type"] == "queue"
    assert call_args[1]["config"]["topic"] == "orders.created"
    assert call_args[1]["config"]["metadata"]["type"] == "queue"


@pytest.mark.asyncio
async def test_ctx_emit_uses_enqueue_for_event_triggers(mock_bridge: MagicMock) -> None:
    """ctx.emit should invoke queue enqueue function for event-trigger handlers."""
    from motia.step_wrapper import register_step

    config = StepConfig(
        name="event-emit-compat",
        triggers=[queue("orders.created")],
    )

    async def handler(input_data: object, ctx: FlowContext[object]) -> None:
        _ = input_data
        await ctx.emit(
            {
                "topic": "orders.processed",
                "data": {"order_id": "123"},
            }
        )

    with patch("motia.step_wrapper.bridge", mock_bridge):
        register_step(config, "steps/test.step.py", handler)
        registered_handler = mock_bridge.register_function.call_args_list[0][0][1]
        await registered_handler({"source": "test"})

    mock_bridge.call.assert_awaited_once_with(
        "enqueue",
        {
            "topic": "orders.processed",
            "data": {"order_id": "123"},
        },
    )


@pytest.mark.asyncio
async def test_ctx_emit_uses_enqueue_for_api_triggers(mock_bridge: MagicMock) -> None:
    """ctx.emit should invoke queue enqueue function for API-trigger handlers too."""
    from motia.step_wrapper import register_step

    config = StepConfig(
        name="api-emit-compat",
        triggers=[api("POST", "/orders")],
    )

    async def handler(req: ApiRequest[dict], ctx: FlowContext[dict]) -> ApiResponse[dict]:
        _ = req
        await ctx.emit(
            {
                "topic": "orders.created",
                "data": {"order_id": "abc"},
            }
        )
        return ApiResponse(status=200, body={"ok": True})

    with patch("motia.step_wrapper.bridge", mock_bridge):
        register_step(config, "steps/test.step.py", handler)
        registered_handler = mock_bridge.register_function.call_args_list[0][0][1]
        await registered_handler(
            {
                "path": "/orders",
                "method": "POST",
                "path_params": {},
                "query_params": {},
                "body": {"hello": "world"},
                "headers": {},
            }
        )

    mock_bridge.call.assert_awaited_once_with(
        "enqueue",
        {
            "topic": "orders.created",
            "data": {"order_id": "abc"},
        },
    )


@pytest.mark.asyncio
async def test_runtime_context_emit_uses_enqueue() -> None:
    """Runtime-built context should emit using enqueue."""
    motia = Motia()
    mock_bridge = MagicMock()
    mock_bridge.call = AsyncMock()

    motia._bridge = mock_bridge

    context = motia._build_context()
    await context.emit({"topic": "runtime.topic", "data": {"value": 1}})

    mock_bridge.call.assert_awaited_once_with(
        "enqueue",
        {"topic": "runtime.topic", "data": {"value": 1}},
    )
