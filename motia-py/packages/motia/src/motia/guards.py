"""Type guards for step configurations."""

from typing import Any

from .types import ApiTrigger, CronTrigger, QueueTrigger, Step


def is_api_step(step: Step[Any]) -> bool:
    """Check if a step has an API trigger."""
    return any(isinstance(t, ApiTrigger) for t in step.config.triggers)


def is_event_step(step: Step[Any]) -> bool:
    """Check if a step has a queue/event trigger."""
    return any(isinstance(t, QueueTrigger) for t in step.config.triggers)


def is_noop_step(step: Step[Any]) -> bool:
    """Check if a step has no triggers."""
    return len(step.config.triggers) == 0


def is_cron_step(step: Step[Any]) -> bool:
    """Check if a step has a cron trigger."""
    return any(isinstance(t, CronTrigger) for t in step.config.triggers)
