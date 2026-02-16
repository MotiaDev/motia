"""Step wrapper for registering steps with the bridge."""

import inspect
import json
import logging
import uuid
from typing import Any, Awaitable, Callable

from iii import get_context

from .bridge import bridge
from .schema_utils import schema_to_json_schema
from .state import StateManager
from .streams import Stream
from .tracing import (
    get_trace_id_from_span,
    instrument_bridge,
    operation_span,
    record_exception,
    set_span_ok,
    step_span,
)
from .types import (
    ApiRequest,
    ApiResponse,
    ApiTrigger,
    CronTrigger,
    FlowContext,
    QueueTrigger,
    StateTrigger,
    Step,
    StepConfig,
    StreamTrigger,
    StreamTriggerInput,
    TriggerConfig,
    TriggerMetadata,
)
from .types_stream import StreamConfig
from .validator import validate_step

log = logging.getLogger("motia.step")


def is_state_trigger(trigger: TriggerConfig) -> bool:
    """Check if trigger is a state trigger."""
    return isinstance(trigger, StateTrigger)


def is_stream_trigger(trigger: TriggerConfig) -> bool:
    """Check if trigger is a stream trigger."""
    return isinstance(trigger, StreamTrigger)


def _compose_middleware(
    middlewares: list[Callable[[Any, Any, Callable[[], Awaitable[Any]]], Awaitable[Any]]],
) -> Callable[[Any, Any, Callable[[], Awaitable[Any]]], Awaitable[Any]]:
    """Compose multiple middlewares into a single middleware."""

    async def composed(req: Any, ctx: Any, handler: Callable[[], Awaitable[Any]]) -> Any:
        async def create_next(index: int) -> Callable[[], Awaitable[Any]]:
            if index >= len(middlewares):
                return handler

            async def next_handler() -> Any:
                return await middlewares[index](req, ctx, await create_next(index + 1))

            return next_handler

        if not middlewares:
            return await handler()

        first_next = await create_next(1)
        return await middlewares[0](req, ctx, first_next)

    return composed


def _jsonable_value(value: Any) -> tuple[bool, Any | None]:
    if value is None:
        return True, None
    if callable(value):
        return False, None
    json_schema = schema_to_json_schema(value)
    if json_schema is not None:
        return True, json_schema
    try:
        json.dumps(value)
    except TypeError:
        return False, None
    return True, value


def _sanitize_trigger_metadata(trigger: TriggerConfig) -> dict[str, Any]:
    data = trigger.model_dump(by_alias=True, exclude_none=True)
    data.pop("condition", None)
    data.pop("middleware", None)

    if isinstance(trigger, QueueTrigger):
        ok, input_value = _jsonable_value(trigger.input)
        if ok and input_value is not None:
            data["input"] = input_value
        else:
            data.pop("input", None)

    if isinstance(trigger, ApiTrigger):
        ok, body_value = _jsonable_value(trigger.body_schema)
        if ok and body_value is not None:
            data["bodySchema"] = body_value
        else:
            data.pop("bodySchema", None)

        if trigger.response_schema:
            response_schema: dict[int, Any] = {}
            for status_code, schema in trigger.response_schema.items():
                ok, schema_value = _jsonable_value(schema)
                if ok and schema_value is not None:
                    response_schema[status_code] = schema_value
            if response_schema:
                data["responseSchema"] = response_schema
            else:
                data.pop("responseSchema", None)

    return data


def _trigger_to_engine_config(trigger: TriggerConfig, metadata: dict[str, Any]) -> dict[str, Any]:
    """Convert trigger config to engine config format."""
    if isinstance(trigger, QueueTrigger):
        return {
            "topic": trigger.subscribes[0] if trigger.subscribes else "",
            "metadata": metadata,
        }
    elif isinstance(trigger, ApiTrigger):
        api_path = trigger.path
        if api_path.startswith("/"):
            api_path = api_path[1:]
        return {
            "api_path": api_path,
            "http_method": trigger.method,
            "metadata": metadata,
        }
    elif isinstance(trigger, CronTrigger):
        return {"expression": trigger.expression, "metadata": metadata}
    elif isinstance(trigger, StateTrigger):
        return {"metadata": metadata}
    elif isinstance(trigger, StreamTrigger):
        config = {"metadata": metadata, "stream_name": trigger.stream_name}
        if trigger.group_id:
            config["group_id"] = trigger.group_id
        if trigger.item_id:
            config["item_id"] = trigger.item_id
        return config
    return {}


def _validate_input_schema(schema: Any, value: Any, label: str) -> Any:
    """Validate input with a Pydantic model or JSON Schema if available."""
    if schema is None:
        return value

    if isinstance(schema, type):
        try:
            from pydantic import BaseModel

            if issubclass(schema, BaseModel):
                return schema.model_validate(value)
        except Exception as exc:  # pragma: no cover - optional validation path
            log.debug("Failed to validate %s with Pydantic: %s", label, exc)
            return value

    json_schema = schema_to_json_schema(schema)
    if json_schema:
        try:
            import jsonschema  # type: ignore

            jsonschema.validate(instance=value, schema=json_schema)
        except Exception as exc:  # pragma: no cover - optional validation path
            log.debug("Failed to validate %s with JSON Schema: %s", label, exc)

    return value


def register_step(
    config: StepConfig,
    step_path: str,
    handler: Callable[..., Awaitable[Any]],
    streams: dict[str, Stream[Any]] | None = None,
) -> None:
    """Register a step with the bridge."""
    if not isinstance(config, StepConfig):
        config = StepConfig.model_validate(config)
    step: Step[Any] = Step(file_path=step_path, version="", config=config)
    state = StateManager()
    streams = streams or {}

    errors = validate_step(step.config)
    if errors:
        raise ValueError(f"Invalid step config for {step.config.name}: {', '.join(errors)}")

    instrument_bridge(bridge)

    log.info(f"Step registered: {step.config.name}")

    for trigger_index, trigger in enumerate(config.triggers):
        function_path = f"steps::{step.config.name}::trigger::{trigger_index}"

        is_api_trigger = isinstance(trigger, ApiTrigger)

        if is_api_trigger:

            async def api_handler(
                req: dict[str, Any],
                _trigger: TriggerConfig = trigger,
            ) -> dict[str, Any]:
                with step_span(
                    step.config.name,
                    "api",
                    **{"http.method": req.get("method"), "http.route": req.get("path")},
                ) as span:
                    try:
                        context_data = get_context()

                        trigger_metadata = TriggerMetadata(
                            type="api",
                            path=req.get("path"),
                            method=req.get("method"),
                        )

                        async def emit(event: Any) -> None:
                            with operation_span("emit", **{"motia.step.name": step.config.name}):
                                await bridge.call("enqueue", event)

                        motia_request: ApiRequest[Any] = ApiRequest(
                            path_params=req.get("path_params", {}),
                            query_params=req.get("query_params", {}),
                            body=req.get("body"),
                            headers=req.get("headers", {}),
                        )

                        if isinstance(_trigger, ApiTrigger) and _trigger.body_schema:
                            motia_request.body = _validate_input_schema(
                                _trigger.body_schema,
                                motia_request.body,
                                f"api:{step.config.name}",
                            )

                        trace_id = get_trace_id_from_span() or str(uuid.uuid4())

                        context: FlowContext[Any] = FlowContext(
                            emit=emit,
                            trace_id=trace_id,
                            state=state,
                            logger=context_data.logger,
                            streams=streams,
                            trigger=trigger_metadata,
                            _input=motia_request,
                        )

                        middlewares: list[Any] = []
                        if isinstance(_trigger, ApiTrigger) and _trigger.middleware:
                            middlewares = _trigger.middleware

                        if middlewares:
                            composed = _compose_middleware(middlewares)
                            response: ApiResponse[Any] = await composed(
                                motia_request, context, lambda: handler(motia_request, context)
                            )
                        else:
                            response = await handler(motia_request, context)

                        set_span_ok(span)
                        return {
                            "status_code": response.status,
                            "headers": response.headers,
                            "body": response.body,
                        }
                    except Exception as exc:
                        record_exception(span, exc)
                        raise

            bridge.register_function(function_path, api_handler)
        else:

            async def event_handler(req: Any, _trigger: TriggerConfig = trigger) -> Any:
                trigger_type_name = _trigger.type if hasattr(_trigger, "type") else "queue"
                with step_span(step.config.name, trigger_type_name) as span:
                    try:
                        context_data = get_context()

                        if isinstance(_trigger, QueueTrigger):
                            trigger_metadata = TriggerMetadata(
                                type="queue",
                                topic=_trigger.subscribes[0] if _trigger.subscribes else None,
                            )
                        elif isinstance(_trigger, CronTrigger):
                            trigger_metadata = TriggerMetadata(
                                type="cron",
                                expression=_trigger.expression,
                            )
                        elif isinstance(_trigger, StateTrigger):
                            trigger_metadata = TriggerMetadata(
                                type="state",
                                index=trigger_index,
                            )
                        elif isinstance(_trigger, StreamTrigger):
                            trigger_metadata = TriggerMetadata(
                                type="stream",
                                index=trigger_index,
                                stream_name=_trigger.stream_name,
                                group_id=_trigger.group_id,
                                item_id=_trigger.item_id,
                            )
                        else:
                            trigger_metadata = TriggerMetadata(type="queue")

                        async def emit(event: Any) -> None:
                            with operation_span("emit", **{"motia.step.name": step.config.name}):
                                await bridge.call("enqueue", event)

                        input_data = None if isinstance(_trigger, CronTrigger) else req
                        if isinstance(_trigger, QueueTrigger) and _trigger.input:
                            input_data = _validate_input_schema(
                                _trigger.input,
                                input_data,
                                f"queue:{step.config.name}",
                            )
                        elif isinstance(_trigger, StreamTrigger):
                            input_data = StreamTriggerInput.model_validate(input_data)

                        trace_id = get_trace_id_from_span() or str(uuid.uuid4())

                        context: FlowContext[Any] = FlowContext(
                            emit=emit,
                            trace_id=trace_id,
                            state=state,
                            logger=context_data.logger,
                            streams=streams,
                            trigger=trigger_metadata,
                            _input=input_data,
                        )

                        result = await handler(input_data, context)
                        set_span_ok(span)
                        return result
                    except Exception as exc:
                        record_exception(span, exc)
                        raise

            bridge.register_function(function_path, event_handler)

        trigger_metadata = _sanitize_trigger_metadata(trigger)
        engine_config = _trigger_to_engine_config(trigger, trigger_metadata)

        if trigger.condition:
            condition_function_path = f"{function_path}::conditions::{trigger_index}"
            engine_config["_condition_path"] = condition_function_path

            async def condition_handler(input_data: Any, _trigger: TriggerConfig = trigger) -> bool:
                context_data = get_context()

                trigger_metadata = TriggerMetadata(type=_trigger.type)

                async def emit(event: Any) -> None:
                    pass

                context: FlowContext[Any] = FlowContext(
                    emit=emit,
                    trace_id="",
                    state=state,
                    logger=context_data.logger,
                    streams=streams,
                    trigger=trigger_metadata,
                    _input=input_data,
                )

                if _trigger.condition is None:
                    return True
                result = _trigger.condition(input_data, context)
                if inspect.iscoroutine(result):
                    return bool(await result)
                return bool(result)

            bridge.register_function(condition_function_path, condition_handler)

        bridge.register_trigger(
            trigger_type=trigger.type,
            function_id=function_path,
            config=engine_config,
        )


def stream_wrapper(config: StreamConfig, stream_path: str) -> Stream[Any]:
    """Create and register a stream."""
    log.info(f"Stream registered: {config.name}")
    return Stream(config.name)
