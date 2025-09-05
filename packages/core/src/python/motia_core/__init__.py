from typing import Protocol, TypeVar, Never,TypedDict, Generic, Literal, Union, Any, NotRequired, Mapping, Optional, List
from dataclasses import dataclass
from .logger import Logger
from collections.abc import Callable, Awaitable

TData = TypeVar("TData")

class Emitter(Protocol[TData]):
    async def __call__(self, event: TData) -> None: ...

class InternalStateManager(Protocol):
    async def get[T](self, group_id: str, key: str) -> T | None: ...
    async def set[T](self, group_id: str, key: str, value: T) -> T: ...
    async def delete[T](self, group_id: str, key: str) -> T | None: ...
    async def get_group[T](self, group_id: str) -> list[T]: ...
    async def clear(self, group_id: str) -> None: ...

class FlowContextStateStreams(TypedDict):
    pass

TStatus = TypeVar("TStatus", bound=int, default=int)
TBody = TypeVar("TBody", default=str | bytes | Mapping[str, object])

class ApiResponse(TypedDict, Generic[TStatus, TBody]):
    status: TStatus
    body: TBody
    headers: NotRequired[Mapping[str, str]]

@dataclass
class QueryParam:
    name: str
    description: str

class FlowContext[TEmitData = Never](Protocol):
    emit: Emitter[TEmitData]
    trace_id: str
    state: InternalStateManager
    logger: Logger
    streams: FlowContextStateStreams

@dataclass
class ApiRequest[
    TBody = object,
]:
    pathParams: dict[str, str]
    queryParams: dict[str, str | list[str]]
    body: TBody
    headers: dict[str, str | list[str]]

TApiReqBody = TypeVar("TApiReqBody")

class ApiReq(TypedDict, Generic[TApiReqBody]):
    pathParams: dict[str, str]
    queryParams: dict[str, str | list[str]]
    body: TApiReqBody
    headers: dict[str, str | list[str]]

class ApiMiddleware[
    TBody = object,
    TEmitData = Never,
    TResult = object,
](Protocol):
    async def __call__(
        self,
        req: ApiRequest[TBody],
        ctx: FlowContext[TEmitData],
        next: Callable[[], Awaitable[ApiResponse[int, TResult]]],
    ) -> ApiResponse[int, TResult]: ...

ApiRouteMethod = Literal["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]

@dataclass
class EmitObject:
    topic: str
    label: str | None = None
    conditional: bool | None = None

Emit = str | EmitObject

@dataclass
class ApiRouteConfig:
    type: Literal["api"]
    name: str
    path: str
    method: ApiRouteMethod
    emits: list[Emit]
    description: str | None = None
    virtualEmits: list[Emit] | None = None
    virtualSubscribes: list[str] | None = None
    flows: list[str] | None = None
    middleware: list[ApiMiddleware[Any, Any, Any]] | None = None
    bodySchema: object | None = None
    responseSchema: dict[int, object] | None = None                
    queryParams: list[QueryParam] | None = None
    includeFiles: list[str] | None = None

@dataclass
class CronStepConfig:
    type: Literal["cron"]
    name: str
    cron: str
    emits: list[Emit]
    description: str | None = None
    virtualEmits: list[Emit] | None = None
    flows: list[str] | None = None

    # Files to include in the step bundle.
    # Needs to be relative to the step file.
    includeFiles: list[str] | None = None

@dataclass
class EventStepConfig:
    type: Literal["event"]
    name: str
    subscribes: list[str]
    emits: list[Emit]
    input: object
    description: str | None = None
    virtualEmits: list[Emit] | None = None
    flows: list[str] | None = None
    
    # Files to include in the step bundle.
    # Needs to be relative to the step file.
    includeFiles: list[str] | None = None

# Stream - Types
class HasId(TypedDict):
    id: str

TPayload = TypeVar("TPayload", contravariant=True)
TItem = TypeVar("TItem", bound=HasId)

U = TypeVar("U")

class StateStreamEventChannel(TypedDict, total=False):
    groupId: str
    id: str  # optional

class StateStreamEvent(TypedDict, Generic[U]):
    type: str
    data: U

# ---- MotiaStream ----
class MotiaStream(Protocol[TPayload, TItem]):
    def get(self, group_id: str, id: str) -> Awaitable[Optional[TItem]]: ...
    def set(self, group_id: str, id: str, data: TPayload) -> Awaitable[TItem]: ...
    def delete(self, group_id: str, id: str) -> Awaitable[Optional[TItem]]: ...
    def get_group(self, group_id: str) -> Awaitable[List[TItem]]: ...
    def send(self, channel: StateStreamEventChannel, event: StateStreamEvent[U]) -> Awaitable[None]: ...

class BaseConfigCustom(TypedDict):
    storageType: Literal['custom']
    factory: Callable[[], MotiaStream[Any, Any]]

class BaseConfigDefault(TypedDict):
    storageType: Literal['default']

class StreamConfig(TypedDict):
    name: str
    schema: object
    baseConfig : BaseConfigCustom | BaseConfigDefault