"""Trigger helper constructors."""

from __future__ import annotations

from typing import Any

from .types import ApiRouteMethod, ApiTrigger, CronTrigger, QueueTrigger


def api(
    method: ApiRouteMethod,
    path: str,
    *,
    body_schema: Any | None = None,
    response_schema: dict[int, Any] | None = None,
    query_params: list[Any] | None = None,
    middleware: list[Any] | None = None,
    condition: Any | None = None,
) -> ApiTrigger:
    """Create an API trigger configuration."""
    return ApiTrigger(
        path=path,
        method=method,
        condition=condition,
        body_schema=body_schema,
        response_schema=response_schema,
        query_params=query_params,
        middleware=middleware,
    )


def queue(
    topic: str,
    *,
    input: Any | None = None,
    infrastructure: Any | None = None,
    condition: Any | None = None,
) -> QueueTrigger:
    """Create a queue trigger configuration."""
    return QueueTrigger(
        subscribes=[topic],
        condition=condition,
        input=input,
        infrastructure=infrastructure,
    )


def event(
    topic: str,
    *,
    input: Any | None = None,
    infrastructure: Any | None = None,
    condition: Any | None = None,
) -> QueueTrigger:
    """Backward-compatible alias for queue() trigger constructor."""
    return queue(topic, input=input, infrastructure=infrastructure, condition=condition)


def cron(expression: str, *, condition: Any | None = None) -> CronTrigger:
    """Create a cron trigger configuration."""
    return CronTrigger(expression=expression, condition=condition)
