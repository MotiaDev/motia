"""Type definitions for Motia framework."""

from __future__ import annotations

from typing import Any, Awaitable, Callable, Generic, Literal, Protocol, TypeVar

from pydantic import BaseModel, ConfigDict, Field

from .streams import Stream

TInput = TypeVar("TInput")
TOutput = TypeVar("TOutput")
TEnqueueData = TypeVar("TEnqueueData")
TBody = TypeVar("TBody")
TResult = TypeVar("TResult")
TCommon = TypeVar("TCommon")


class InternalStateManager(Protocol):
    """Protocol for internal state management."""

    async def get(self, scope: str, key: str) -> Any | None: ...
    async def set(self, scope: str, key: str, value: Any) -> Any: ...
    async def update(self, scope: str, key: str, ops: list[dict[str, Any]]) -> Any: ...
    async def delete(self, scope: str, key: str) -> Any | None: ...
    async def list(self, scope: str) -> list[Any]: ...
    async def clear(self, scope: str) -> None: ...
    async def list_groups(self) -> list[str]: ...


Enqueuer = Callable[[Any], Awaitable[None]]


class FlowContext(BaseModel, Generic[TEnqueueData]):
    """Context passed to step handlers."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    enqueue: Enqueuer
    trace_id: str
    state: Any  # InternalStateManager
    logger: Any  # Logger
    streams: dict[str, Stream[Any]] = Field(default_factory=dict)
    trigger: "TriggerInfo"
    _input: Any = None

    def is_queue(self) -> bool:
        """Return True if the trigger is a queue trigger."""
        return self.trigger.type == "queue"

    def is_api(self) -> bool:
        """Return True if the trigger is an API request."""
        return self.trigger.type == "http"

    def is_cron(self) -> bool:
        """Return True if the trigger is a cron event."""
        return self.trigger.type == "cron"

    def is_state(self) -> bool:
        """Return True if the trigger is a state change."""
        return self.trigger.type == "state"

    def is_stream(self) -> bool:
        """Return True if the trigger is a stream event."""
        return self.trigger.type == "stream"

    def get_data(self, input: "ApiRequest[TCommon] | TCommon") -> TCommon | None:
        """Extract the data payload from the input."""
        if isinstance(input, ApiRequest):
            return input.body
        return input

    async def match(self, handlers: dict[str, Any]) -> Any:
        """Match handlers based on trigger type."""
        if self.is_queue() and handlers.get("queue"):
            return await handlers["queue"](self._input, self)
        if self.is_api() and (handlers.get("http") or handlers.get("api")):
            api_handler = handlers.get("http") or handlers.get("api")
            return await api_handler(self._input, self)
        if self.is_cron() and handlers.get("cron"):
            return await handlers["cron"](self)
        if self.is_state() and handlers.get("state"):
            return await handlers["state"](self._input, self)
        if self.is_stream() and handlers.get("stream"):
            return await handlers["stream"](self._input, self)
        if handlers.get("default"):
            return await handlers["default"](self._input, self)

        raise RuntimeError(
            f"No handler matched for trigger type: {self.trigger.type}. "
            f"Available handlers: {', '.join(k for k in handlers if k != 'default')}"
        )


class Enqueue(BaseModel):
    """Enqueue configuration."""

    topic: str
    label: str | None = None
    conditional: bool = False


class HandlerConfig(BaseModel):
    """Handler infrastructure configuration."""

    ram: int = 128
    cpu: int | None = None
    timeout: int = 30


class QueueConfig(BaseModel):
    """Queue configuration."""

    model_config = ConfigDict(populate_by_name=True)

    type: Literal["fifo", "standard"] = "standard"
    max_retries: int = Field(default=3, serialization_alias="maxRetries")
    visibility_timeout: int = Field(default=30, serialization_alias="visibilityTimeout")
    delay_seconds: int = Field(default=0, serialization_alias="delaySeconds")


class InfrastructureConfig(BaseModel):
    """Infrastructure configuration."""

    handler: HandlerConfig | None = None
    queue: QueueConfig | None = None


ApiRouteMethod = Literal["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]


class TriggerInfo(BaseModel):
    """Information about the trigger that fired."""

    model_config = ConfigDict(populate_by_name=True)

    type: Literal["http", "queue", "cron", "state", "stream"]
    index: int | None = None

    # API trigger specific
    path: str | None = None
    method: str | None = None

    # Queue trigger specific
    topic: str | None = None

    # Cron trigger specific
    expression: str | None = None


TriggerInput = Any

TriggerCondition = Callable[[Any, FlowContext[Any]], bool | Awaitable[bool]]


class QueueTrigger(BaseModel):
    """Queue trigger configuration."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    type: Literal["queue"] = "queue"
    topic: str
    condition: TriggerCondition | None = None
    input: Any | None = None
    infrastructure: InfrastructureConfig | None = None


class QueryParam(BaseModel):
    """Query parameter definition."""

    name: str
    description: str


class ApiTrigger(BaseModel):
    """API trigger configuration."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    type: Literal["http"] = "http"
    path: str
    method: ApiRouteMethod
    condition: TriggerCondition | None = None
    middleware: list[Any] | None = None  # ApiMiddleware
    body_schema: Any | None = Field(default=None, serialization_alias="bodySchema")
    response_schema: dict[int, Any] | None = Field(default=None, serialization_alias="responseSchema")
    query_params: list[QueryParam] | None = Field(default=None, serialization_alias="queryParams")


class CronTrigger(BaseModel):
    """Cron trigger configuration."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    type: Literal["cron"] = "cron"
    expression: str
    condition: TriggerCondition | None = None


class StateTriggerInput(BaseModel):
    """Input received when a state trigger fires."""

    model_config = ConfigDict(populate_by_name=True)

    type: Literal["state"] = "state"
    group_id: str = Field(alias="groupId")
    item_id: str = Field(alias="itemId")
    old_value: Any | None = Field(default=None, alias="oldValue")
    new_value: Any | None = Field(default=None, alias="newValue")


class StateTrigger(BaseModel):
    """Trigger that fires when state changes."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    type: Literal["state"] = "state"
    condition: TriggerCondition | None = None


def state(*, condition: TriggerCondition | None = None) -> StateTrigger:
    """Create a state trigger."""
    return StateTrigger(type="state", condition=condition)


class StreamEvent(BaseModel):
    """Event data from a stream operation."""

    type: Literal["create", "update", "delete"]
    data: Any


class StreamTriggerInput(BaseModel):
    """Input received when a stream trigger fires."""

    model_config = ConfigDict(populate_by_name=True)

    type: Literal["stream"] = "stream"
    timestamp: int
    stream_name: str = Field(alias="streamName")
    group_id: str = Field(alias="groupId")
    id: str
    event: StreamEvent


class StreamTrigger(BaseModel):
    """Trigger that fires when stream events occur."""

    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    type: Literal["stream"] = "stream"
    stream_name: str = Field(alias="streamName")
    group_id: str | None = Field(default=None, alias="groupId")
    item_id: str | None = Field(default=None, alias="itemId")
    condition: TriggerCondition | None = None


def stream(
    stream_name: str,
    *,
    group_id: str | None = None,
    item_id: str | None = None,
    condition: TriggerCondition | None = None,
) -> StreamTrigger:
    """Create a stream trigger."""
    return StreamTrigger(
        type="stream",
        stream_name=stream_name,
        group_id=group_id,
        item_id=item_id,
        condition=condition,
    )


TriggerConfig = QueueTrigger | ApiTrigger | CronTrigger | StateTrigger | StreamTrigger


class ApiRequest(BaseModel, Generic[TBody]):
    """API request object."""

    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    path_params: dict[str, str] = Field(default_factory=dict, serialization_alias="pathParams")
    query_params: dict[str, str | list[str]] = Field(default_factory=dict, serialization_alias="queryParams")
    body: TBody | None = None
    headers: dict[str, str | list[str]] = Field(default_factory=dict)


class ApiResponse(BaseModel, Generic[TOutput]):
    """API response object."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    status: int
    body: Any
    headers: dict[str, str] = Field(default_factory=dict)


ApiMiddleware = Callable[
    [ApiRequest[Any], FlowContext[Any], Callable[[], Awaitable[ApiResponse[Any]]]],
    Awaitable[ApiResponse[Any]],
]


class StepConfig(BaseModel):
    """Configuration for a step with triggers."""

    model_config = ConfigDict(populate_by_name=True)

    name: str
    triggers: list[TriggerConfig]
    enqueues: list[str | Enqueue] = Field(default_factory=list)
    virtual_enqueues: list[str | Enqueue] | None = Field(default=None, serialization_alias="virtualEnqueues")
    virtual_subscribes: list[str] | None = Field(default=None, serialization_alias="virtualSubscribes")
    description: str | None = None
    flows: list[str] | None = None
    include_files: list[str] | None = Field(default=None, serialization_alias="includeFiles")
    infrastructure: InfrastructureConfig | None = None


class Step(BaseModel):
    """Represents a step in a flow."""

    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    file_path: str = Field(serialization_alias="filePath")
    config: StepConfig
