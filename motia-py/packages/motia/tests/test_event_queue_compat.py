"""Compatibility tests for queue engine contract mapping."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from motia.runtime import Motia
from motia.triggers import http, queue
from motia.types import ApiRequest, ApiResponse, FlowContext, StepConfig


@pytest.fixture
def mock_bridge() -> MagicMock:
    """Create a bridge mock with async call support."""
    bridge = MagicMock()
    bridge.register_function = MagicMock()
    bridge.register_trigger = MagicMock()
    bridge.call = AsyncMock()
    return bridge


@pytest.fixture
def mock_context() -> MagicMock:
    """Create mock III context."""
    ctx = MagicMock()
    ctx.logger = MagicMock()
    return ctx


def test_queue_trigger_registers_as_queue_trigger(mock_bridge: MagicMock, mock_context: MagicMock) -> None:
    """Queue trigger should map to queue trigger type for engine registration."""
    config = StepConfig(
        name="queue-trigger-compat",
        triggers=[queue("orders.created")],
    )

    async def handler(input_data: object, ctx: FlowContext[object]) -> None:
        _ = (input_data, ctx)

    with patch("motia.runtime.get_instance", return_value=mock_bridge), patch(
        "motia.runtime.get_context", return_value=mock_context
    ):
        motia = Motia()
        motia.add_step(config, "steps/test_step.py", handler)

    call_args = mock_bridge.register_trigger.call_args
    assert call_args[0][0] == "queue"
    assert call_args[0][2]["topic"] == "orders.created"


@pytest.mark.asyncio
async def test_ctx_enqueue_uses_enqueue_for_queue_triggers(mock_bridge: MagicMock, mock_context: MagicMock) -> None:
    """ctx.enqueue should invoke queue enqueue function for queue-trigger handlers."""
    config = StepConfig(
        name="queue-enqueue-compat",
        triggers=[queue("orders.created")],
    )

    async def handler(input_data: object, ctx: FlowContext[object]) -> None:
        _ = input_data
        await ctx.enqueue(
            {
                "topic": "orders.processed",
                "data": {"order_id": "123"},
            }
        )

    with patch("motia.runtime.get_instance", return_value=mock_bridge), patch(
        "motia.runtime.get_context", return_value=mock_context
    ):
        motia = Motia()
        motia.add_step(config, "steps/test_step.py", handler)
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
async def test_ctx_enqueue_uses_enqueue_for_api_triggers(mock_bridge: MagicMock, mock_context: MagicMock) -> None:
    """ctx.enqueue should invoke queue enqueue function for API-trigger handlers too."""
    config = StepConfig(
        name="api-emit-compat",
        triggers=[http("POST", "/orders")],
    )

    async def handler(req: ApiRequest[dict], ctx: FlowContext[dict]) -> ApiResponse[dict]:
        _ = req
        await ctx.enqueue(
            {
                "topic": "orders.created",
                "data": {"order_id": "abc"},
            }
        )
        return ApiResponse(status=200, body={"ok": True})

    with patch("motia.runtime.get_instance", return_value=mock_bridge), patch(
        "motia.runtime.get_context", return_value=mock_context
    ):
        motia = Motia()
        motia.add_step(config, "steps/test_step.py", handler)
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
async def test_runtime_context_enqueue_uses_enqueue(mock_bridge: MagicMock, mock_context: MagicMock) -> None:
    """Runtime-built context should enqueue using the III instance call method."""
    config = StepConfig(
        name="runtime-enqueue-test",
        triggers=[queue("runtime.topic")],
    )

    captured_ctx = None

    async def handler(input_data: object, ctx: FlowContext[object]) -> None:
        nonlocal captured_ctx
        captured_ctx = ctx
        await ctx.enqueue({"topic": "runtime.topic", "data": {"value": 1}})

    with patch("motia.runtime.get_instance", return_value=mock_bridge), patch(
        "motia.runtime.get_context", return_value=mock_context
    ):
        motia = Motia()
        motia.add_step(config, "steps/test_step.py", handler)
        registered_handler = mock_bridge.register_function.call_args_list[0][0][1]
        await registered_handler({"source": "test"})

    assert captured_ctx is not None
    mock_bridge.call.assert_awaited_once_with(
        "enqueue",
        {"topic": "runtime.topic", "data": {"value": 1}},
    )
