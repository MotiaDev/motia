"""III message types."""

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class HttpAuthHmac(BaseModel):
    type: Literal["hmac"] = "hmac"
    secret_key: str


class HttpAuthBearer(BaseModel):
    type: Literal["bearer"] = "bearer"
    token_key: str


class HttpAuthApiKey(BaseModel):
    type: Literal["api_key"] = "api_key"
    header: str
    value_key: str


HttpAuthConfig = HttpAuthHmac | HttpAuthBearer | HttpAuthApiKey


class HttpInvocationConfig(BaseModel):
    """Config for HTTP external function invocation."""

    url: str
    method: Literal["GET", "POST", "PUT", "PATCH", "DELETE"] = "POST"
    timeout_ms: int | None = None
    headers: dict[str, str] | None = None
    auth: HttpAuthConfig | None = None


class MessageType(str, Enum):
    """Message types for iii communication."""

    REGISTER_FUNCTION = "registerfunction"
    UNREGISTER_FUNCTION = "unregisterfunction"
    REGISTER_SERVICE = "registerservice"
    INVOKE_FUNCTION = "invokefunction"
    INVOCATION_RESULT = "invocationresult"
    REGISTER_TRIGGER_TYPE = "registertriggertype"
    REGISTER_TRIGGER = "registertrigger"
    UNREGISTER_TRIGGER = "unregistertrigger"
    UNREGISTER_TRIGGER_TYPE = "unregistertriggertype"
    TRIGGER_REGISTRATION_RESULT = "triggerregistrationresult"
    WORKER_REGISTERED = "workerregistered"


class RegisterTriggerTypeMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    description: str
    message_type: MessageType = Field(default=MessageType.REGISTER_TRIGGER_TYPE, alias="type")


class UnregisterTriggerTypeMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    message_type: MessageType = Field(default=MessageType.UNREGISTER_TRIGGER_TYPE, alias="type")


class UnregisterTriggerMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    message_type: MessageType = Field(default=MessageType.UNREGISTER_TRIGGER, alias="type")
    trigger_type: str | None = Field(default=None, alias="trigger_type")


class TriggerRegistrationResultMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    trigger_type: str = Field(alias="trigger_type")
    function_id: str = Field()
    result: Any = None
    error: Any = None
    message_type: MessageType = Field(default=MessageType.TRIGGER_REGISTRATION_RESULT, alias="type")


class RegisterTriggerMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    trigger_type: str = Field(alias="trigger_type")
    function_id: str = Field()
    config: Any
    message_type: MessageType = Field(default=MessageType.REGISTER_TRIGGER, alias="type")


class RegisterServiceMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    description: str | None = None
    parent_service_id: str | None = Field(default=None)
    message_type: MessageType = Field(default=MessageType.REGISTER_SERVICE, alias="type")


class RegisterFunctionFormat(BaseModel):
    """Format definition for function parameters."""

    name: str
    type: str  # 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'map'
    description: str | None = None
    body: list["RegisterFunctionFormat"] | None = None
    items: "RegisterFunctionFormat | None" = None
    required: bool = False


class RegisterFunctionMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field()
    description: str | None = None
    request_format: RegisterFunctionFormat | None = Field(default=None)
    response_format: RegisterFunctionFormat | None = Field(default=None)
    metadata: dict[str, Any] | None = None
    invocation: HttpInvocationConfig | None = None
    message_type: MessageType = Field(default=MessageType.REGISTER_FUNCTION, alias="type")


class InvokeFunctionMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    function_id: str = Field()
    data: Any
    invocation_id: str | None = Field(default=None)
    traceparent: str | None = Field(default=None)
    baggage: str | None = Field(default=None)
    message_type: MessageType = Field(default=MessageType.INVOKE_FUNCTION, alias="type")


class InvocationResultMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    invocation_id: str = Field()
    function_id: str = Field()
    result: Any = None
    error: Any = None
    traceparent: str | None = Field(default=None)
    baggage: str | None = Field(default=None)
    message_type: MessageType = Field(default=MessageType.INVOCATION_RESULT, alias="type")


class WorkerRegisteredMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    worker_id: str = Field()
    message_type: MessageType = Field(default=MessageType.WORKER_REGISTERED, alias="type")


class UnregisterFunctionMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    message_type: MessageType = Field(default=MessageType.UNREGISTER_FUNCTION, alias="type")


class FunctionInfo(BaseModel):
    """Information about a registered function."""

    function_id: str
    description: str | None = None
    request_format: RegisterFunctionFormat | None = None
    response_format: RegisterFunctionFormat | None = None
    metadata: dict[str, Any] | None = None


WorkerStatus = Literal["connected", "available", "busy", "disconnected"]


class WorkerInfo(BaseModel):
    """Information about a connected worker."""

    id: str
    name: str | None = None
    runtime: str | None = None
    version: str | None = None
    os: str | None = None
    ip_address: str | None = None
    status: WorkerStatus
    connected_at_ms: int
    function_count: int
    functions: list[str]
    active_invocations: int


class StreamChannelRef(BaseModel):
    """Reference to a streaming channel for worker-to-worker data transfer."""

    channel_id: str
    access_key: str
    direction: Literal["read", "write"]


IIIMessage = (
    RegisterFunctionMessage
    | UnregisterFunctionMessage
    | InvokeFunctionMessage
    | InvocationResultMessage
    | RegisterServiceMessage
    | RegisterTriggerMessage
    | RegisterTriggerTypeMessage
    | UnregisterTriggerMessage
    | UnregisterTriggerTypeMessage
    | TriggerRegistrationResultMessage
    | WorkerRegisteredMessage
)
