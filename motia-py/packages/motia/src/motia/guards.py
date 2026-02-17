"""Type guards for step and trigger configurations."""

from .types import ApiTrigger, CronTrigger, QueueTrigger, StateTrigger, Step, StreamTrigger, TriggerConfig


# Trigger-level guards (matching Node.js)
def is_api_trigger(trigger: TriggerConfig) -> bool:
    """Check if a trigger is an API trigger."""
    return isinstance(trigger, ApiTrigger)


def is_queue_trigger(trigger: TriggerConfig) -> bool:
    """Check if a trigger is a queue trigger."""
    return isinstance(trigger, QueueTrigger)


def is_cron_trigger(trigger: TriggerConfig) -> bool:
    """Check if a trigger is a cron trigger."""
    return isinstance(trigger, CronTrigger)


def is_state_trigger(trigger: TriggerConfig) -> bool:
    """Check if a trigger is a state trigger."""
    return isinstance(trigger, StateTrigger)


def is_stream_trigger(trigger: TriggerConfig) -> bool:
    """Check if a trigger is a stream trigger."""
    return isinstance(trigger, StreamTrigger)


# Step-level guards
def is_api_step(step: Step) -> bool:
    """Check if a step has an API trigger."""
    return any(is_api_trigger(t) for t in step.config.triggers)


def is_queue_step(step: Step) -> bool:
    """Check if a step has a queue trigger."""
    return any(is_queue_trigger(t) for t in step.config.triggers)


def is_cron_step(step: Step) -> bool:
    """Check if a step has a cron trigger."""
    return any(is_cron_trigger(t) for t in step.config.triggers)


# Getter helpers (matching Node.js)
def get_api_triggers(step: Step) -> list[ApiTrigger]:
    """Get all API triggers from a step."""
    return [t for t in step.config.triggers if isinstance(t, ApiTrigger)]


def get_queue_triggers(step: Step) -> list[QueueTrigger]:
    """Get all queue triggers from a step."""
    return [t for t in step.config.triggers if isinstance(t, QueueTrigger)]


def get_cron_triggers(step: Step) -> list[CronTrigger]:
    """Get all cron triggers from a step."""
    return [t for t in step.config.triggers if isinstance(t, CronTrigger)]
