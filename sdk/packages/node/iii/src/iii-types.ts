export enum MessageType {
  RegisterFunction = 'registerfunction',
  UnregisterFunction = 'unregisterfunction',
  RegisterService = 'registerservice',
  InvokeFunction = 'invokefunction',
  InvocationResult = 'invocationresult',
  RegisterTriggerType = 'registertriggertype',
  RegisterTrigger = 'registertrigger',
  UnregisterTrigger = 'unregistertrigger',
  UnregisterTriggerType = 'unregistertriggertype',
  TriggerRegistrationResult = 'triggerregistrationresult',
  WorkerRegistered = 'workerregistered',
}

export type RegisterTriggerTypeMessage = {
  message_type: MessageType.RegisterTriggerType
  id: string
  description: string
}

export type UnregisterTriggerTypeMessage = {
  message_type: MessageType.UnregisterTriggerType
  id: string
}

export type UnregisterTriggerMessage = {
  message_type: MessageType.UnregisterTrigger
  id: string
  type?: string
}

export type TriggerRegistrationResultMessage = {
  message_type: MessageType.TriggerRegistrationResult
  id: string
  type: string
  function_id: string
  result?: unknown
  error?: unknown
}

export type RegisterTriggerMessage = {
  message_type: MessageType.RegisterTrigger
  id: string
  type: string
  function_id: string
  config: unknown
}

export type RegisterServiceMessage = {
  message_type: MessageType.RegisterService
  id: string
  description?: string
  parent_service_id?: string
}

export type HttpAuthConfig =
  | { type: 'hmac'; secret_key: string }
  | { type: 'bearer'; token_key: string }
  | { type: 'api_key'; header: string; value_key: string }

export type HttpInvocationConfig = {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  timeout_ms?: number
  headers?: Record<string, string>
  auth?: HttpAuthConfig
}

export type RegisterFunctionFormat = {
  name: string
  /**
   * The description of the parameter
   */
  description?: string
  /**
   * The type of the parameter
   */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'map'
  /**
   * The body of the parameter
   */
  body?: RegisterFunctionFormat[]
  /**
   * The items of the parameter
   */
  items?: RegisterFunctionFormat
  /**
   * Whether the parameter is required
   */
  required?: boolean
}

export type RegisterFunctionMessage = {
  message_type: MessageType.RegisterFunction
  /**
   * The path of the function (use :: for namespacing, e.g. external::my_lambda)
   */
  id: string
  /**
   * The description of the function
   */
  description?: string
  /**
   * The request format of the function
   */
  request_format?: RegisterFunctionFormat
  /**
   * The response format of the function
   */
  response_format?: RegisterFunctionFormat
  metadata?: Record<string, unknown>
  /**
   * HTTP invocation config for external HTTP functions (Lambda, Cloudflare Workers, etc.)
   */
  invocation?: HttpInvocationConfig
}

export type InvokeFunctionMessage = {
  message_type: MessageType.InvokeFunction
  /**
   * This is optional for async invocations
   */
  invocation_id?: string
  /**
   * The path of the function
   */
  function_id: string
  /**
   * The data to pass to the function
   */
  data: unknown
  /**
   * W3C trace-context traceparent header for distributed tracing
   */
  traceparent?: string
  /**
   * W3C baggage header for cross-cutting context propagation
   */
  baggage?: string
}

export type InvocationResultMessage = {
  message_type: MessageType.InvocationResult
  /**
   * The id of the invocation
   */
  invocation_id: string
  /**
   * The path of the function
   */
  function_id: string
  result?: unknown
  error?: unknown
  /**
   * W3C trace-context traceparent header for distributed tracing
   */
  traceparent?: string
  /**
   * W3C baggage header for cross-cutting context propagation
   */
  baggage?: string
}

export type FunctionInfo = {
  function_id: string
  description?: string
  request_format?: RegisterFunctionFormat
  response_format?: RegisterFunctionFormat
  metadata?: Record<string, unknown>
}

export type WorkerStatus = 'connected' | 'available' | 'busy' | 'disconnected'

export type WorkerInfo = {
  id: string
  name?: string
  runtime?: string
  version?: string
  os?: string
  ip_address?: string
  status: WorkerStatus
  connected_at_ms: number
  function_count: number
  functions: string[]
  active_invocations: number
}

export type WorkerRegisteredMessage = {
  message_type: MessageType.WorkerRegistered
  worker_id: string
}

export type UnregisterFunctionMessage = {
  message_type: MessageType.UnregisterFunction
  id: string
}

export type StreamChannelRef = {
  channel_id: string
  access_key: string
  direction: 'read' | 'write'
}

export type IIIMessage =
  | RegisterFunctionMessage
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
