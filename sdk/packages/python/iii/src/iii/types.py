"""Type definitions for the III SDK."""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Awaitable, Callable, Generic, Protocol, TypeVar

from pydantic import BaseModel, ConfigDict, Field

from .iii_types import (
    FunctionInfo,
    RegisterFunctionMessage,
    RegisterTriggerMessage,
    RegisterTriggerTypeMessage,
    StreamChannelRef,
)
from .stream import IStream
from .triggers import Trigger, TriggerHandler

if TYPE_CHECKING:
    from .channels import ChannelReader, ChannelWriter, WritableStream

TInput = TypeVar("TInput")
TOutput = TypeVar("TOutput")
TConfig = TypeVar("TConfig")


RemoteFunctionHandler = Callable[[Any], Awaitable[Any]]


class RemoteFunctionData(BaseModel):
    """Data for a remote function."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    message: RegisterFunctionMessage
    handler: RemoteFunctionHandler


class RemoteTriggerTypeData(BaseModel):
    """Data for a remote trigger type."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    message: RegisterTriggerTypeMessage
    handler: TriggerHandler[Any]


class Invocation(Generic[TOutput]):
    """Represents an invocation that can be resolved or rejected."""

    def __init__(self, future: asyncio.Future[TOutput]) -> None:
        self._future = future

    def resolve(self, value: TOutput) -> None:
        """Resolve the invocation with a value."""
        if not self._future.done():
            self._future.set_result(value)

    def reject(self, error: Exception) -> None:
        """Reject the invocation with an error."""
        if not self._future.done():
            self._future.set_exception(error)


class RemoteServiceFunctionData(BaseModel):
    """Data for a remote service function."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    message: RegisterFunctionMessage
    handler: RemoteFunctionHandler


# Type aliases for registration inputs
RegisterTriggerInput = RegisterTriggerMessage
RegisterServiceInput = str
RegisterFunctionInput = RegisterFunctionMessage
RegisterTriggerTypeInput = RegisterTriggerTypeMessage


# Callback type for functions available event
FunctionsAvailableCallback = Callable[[list[FunctionInfo]], None]


class IIIClient(Protocol):
    """Protocol for III client implementations."""

    def register_trigger(self, trigger: RegisterTriggerMessage) -> Trigger: ...

    def register_service(self, service_id: str, description: str | None = None) -> None: ...

    def register_function(
        self,
        function_id: str,
        handler: RemoteFunctionHandler,
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Any: ...

    async def trigger(self, function_id: str, data: Any, timeout: float = 30.0) -> Any: ...

    def trigger_void(self, function_id: str, data: Any) -> None: ...

    async def call(self, function_id: str, data: Any, timeout: float = 30.0) -> Any: ...

    def call_void(self, function_id: str, data: Any) -> None: ...

    def register_trigger_type(
        self,
        trigger_type_id: str,
        description: str,
        handler: TriggerHandler[Any],
    ) -> None: ...

    def unregister_trigger_type(self, trigger_type_id: str) -> None: ...

    def on(self, event: str, callback: Callable[..., None]) -> Callable[[], None]: ...

    async def create_channel(self, buffer_size: int | None = None) -> Channel: ...

    def create_stream(self, stream_name: str, stream: IStream[Any]) -> None: ...

    def on_functions_available(self, callback: FunctionsAvailableCallback) -> Callable[[], None]: ...


class ApiRequest(BaseModel, Generic[TInput]):
    """Represents an API request."""

    model_config = ConfigDict(populate_by_name=True)

    path_params: dict[str, str] = Field(default_factory=dict, alias="pathParams")
    query_params: dict[str, str | list[str]] = Field(default_factory=dict, alias="queryParams")
    body: Any | None = None
    headers: dict[str, str | list[str]] = Field(default_factory=dict)
    method: str = "GET"


class ApiResponse(BaseModel, Generic[TOutput]):
    """Represents an API response."""

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    status_code: int = Field(alias="statusCode")
    body: Any
    headers: dict[str, str] = Field(default_factory=dict)


@dataclass
class Channel:
    """A streaming channel pair for worker-to-worker data transfer."""

    writer: ChannelWriter
    reader: ChannelReader
    writer_ref: StreamChannelRef
    reader_ref: StreamChannelRef


@dataclass
class InternalHttpRequest:
    """HTTP request with embedded channel references for streaming."""

    path_params: dict[str, str]
    query_params: dict[str, str | list[str]]
    body: Any
    headers: dict[str, str | list[str]]
    method: str
    response: ChannelWriter
    request_body: ChannelReader


class HttpResponse:
    """Streaming HTTP response built on top of a ChannelWriter."""

    def __init__(self, writer: ChannelWriter) -> None:
        self._writer = writer

    async def status(self, status_code: int) -> None:
        await self._writer.send_message_async(json.dumps({"type": "set_status", "status_code": status_code}))

    async def headers(self, headers: dict[str, str]) -> None:
        await self._writer.send_message_async(json.dumps({"type": "set_headers", "headers": headers}))

    @property
    def stream(self) -> WritableStream:
        return self._writer.stream

    @property
    def writer(self) -> ChannelWriter:
        return self._writer

    def close(self) -> None:
        self._writer.close()


@dataclass
class HttpRequest:
    """HTTP request without the response writer."""

    path_params: dict[str, str]
    query_params: dict[str, str | list[str]]
    body: Any
    headers: dict[str, str | list[str]]
    method: str
    request_body: ChannelReader


def is_channel_ref(value: Any) -> bool:
    """Check if a value looks like a StreamChannelRef."""
    return (
        isinstance(value, dict)
        and isinstance(value.get("channel_id"), str)
        and isinstance(value.get("access_key"), str)
        and value.get("direction") in {"read", "write"}
    )
