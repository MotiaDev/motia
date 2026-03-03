import type {
  FunctionInfo,
  HttpInvocationConfig,
  RegisterFunctionMessage,
  RegisterServiceMessage,
  RegisterTriggerMessage,
  RegisterTriggerTypeMessage,
  StreamChannelRef,
} from './iii-types'
import type { TriggerHandler } from './triggers'
import type { IStream } from './stream'
import type { ChannelReader, ChannelWriter } from './channels'

// biome-ignore lint/suspicious/noExplicitAny: generic defaults require any for contravariant compatibility
export type RemoteFunctionHandler<TInput = any, TOutput = any> = (data: TInput) => Promise<TOutput>

/** OTEL Log Event from the engine */
export type OtelLogEvent = {
  /** Timestamp in Unix nanoseconds */
  timestamp_unix_nano: number
  /** Observed timestamp in Unix nanoseconds */
  observed_timestamp_unix_nano: number
  /** OTEL severity number (1-24): TRACE=1-4, DEBUG=5-8, INFO=9-12, WARN=13-16, ERROR=17-20, FATAL=21-24 */
  severity_number: number
  /** Severity text (e.g., "INFO", "WARN", "ERROR") */
  severity_text: string
  /** Log message body */
  body: string
  /** Structured attributes */
  attributes: Record<string, unknown>
  /** Trace ID for correlation (if available) */
  trace_id?: string
  /** Span ID for correlation (if available) */
  span_id?: string
  /** Resource attributes from the emitting service */
  resource: Record<string, string>
  /** Service name that emitted the log */
  service_name: string
  /** Instrumentation scope name (if available) */
  instrumentation_scope_name?: string
  /** Instrumentation scope version (if available) */
  instrumentation_scope_version?: string
}

/** Severity levels for log filtering */
export type LogSeverityLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'all'

/** Optional configuration for onLog */
export type LogConfig = {
  /** Minimum severity level to receive (default: 'all') */
  level?: LogSeverityLevel
}

/** Callback type for log events */
export type LogCallback = (log: OtelLogEvent) => void
// biome-ignore lint/suspicious/noExplicitAny: generic default requires any for contravariant compatibility
export type Invocation<TOutput = any> = {
  resolve: (data: TOutput) => void
  // biome-ignore lint/suspicious/noExplicitAny: error can be any type
  reject: (error: any) => void
}

/** Internal handler type that includes traceparent and baggage for distributed tracing */
// biome-ignore lint/suspicious/noExplicitAny: generic defaults require any for contravariant compatibility
export type InternalFunctionHandler<TInput = any, TOutput = any> = (
  data: TInput,
  traceparent?: string,
  baggage?: string,
) => Promise<TOutput>

export type RemoteFunctionData = {
  message: RegisterFunctionMessage
  handler: InternalFunctionHandler
}

export type RemoteServiceFunctionData = {
  message: Omit<RegisterFunctionMessage, 'serviceId'>
  handler: RemoteFunctionHandler
}

export type RemoteTriggerTypeData = {
  message: RegisterTriggerTypeMessage
  // biome-ignore lint/suspicious/noExplicitAny: handler accepts any trigger config type
  handler: TriggerHandler<any>
}

export type RegisterTriggerInput = Omit<RegisterTriggerMessage, 'message_type' | 'id'>
export type RegisterServiceInput = Omit<RegisterServiceMessage, 'message_type'>
export type RegisterFunctionInput = Omit<RegisterFunctionMessage, 'message_type'>
export type RegisterTriggerTypeInput = Omit<RegisterTriggerTypeMessage, 'message_type'>
export type FunctionsAvailableCallback = (functions: FunctionInfo[]) => void

export interface ISdk {
  /**
   * Registers a new trigger. A trigger is a way to invoke a function when a certain event occurs.
   * @param trigger - The trigger to register
   * @returns A trigger object that can be used to unregister the trigger
   */
  registerTrigger(trigger: RegisterTriggerInput): Trigger

  /**
   * Registers a new function. A function is a unit of work that can be invoked by other services.
   * @param func - The function to register
   * @param handler - The handler for the function
   * @returns A function object that can be used to invoke the function
   */
  registerFunction(func: RegisterFunctionInput, handler: RemoteFunctionHandler): FunctionRef

  /**
   * Registers an HTTP external function (Lambda, Cloudflare Workers, etc.). The engine invokes the URL when triggered.
   * @param id - Function path (use :: for namespacing, e.g. external::my_lambda)
   * @param config - HTTP endpoint config (url, method, timeout_ms, headers, auth)
   * @returns A function ref for unregistering
   */
  registerHttpFunction(id: string, config: HttpInvocationConfig): FunctionRef

  /**
   * Invokes a function.
   * @param function_id - The path to the function
   * @param data - The data to pass to the function
   * @param timeoutMs - Optional timeout in milliseconds
   * @returns The result of the function
   */
  trigger<TInput, TOutput>(function_id: string, data: TInput, timeoutMs?: number): Promise<TOutput>

  /**
   * Lists all registered functions.
   */
  listFunctions(): Promise<FunctionInfo[]>

  /**
   * Invokes a function asynchronously.
   * @param function_id - The path to the function
   * @param data - The data to pass to the function
   */
  triggerVoid<TInput>(function_id: string, data: TInput): void

  call<TInput, TOutput>(function_id: string, data: TInput, timeoutMs?: number): Promise<TOutput>

  callVoid<TInput>(function_id: string, data: TInput): void

  /**
   * Registers a new trigger type. A trigger type is a way to invoke a function when a certain event occurs.
   * @param triggerType - The trigger type to register
   * @param handler - The handler for the trigger type
   * @returns A trigger type object that can be used to unregister the trigger type
   */
  registerTriggerType<TConfig>(
    triggerType: RegisterTriggerTypeInput,
    handler: TriggerHandler<TConfig>,
  ): void

  /**
   * Unregisters a trigger type.
   * @param triggerType - The trigger type to unregister
   */
  unregisterTriggerType(triggerType: RegisterTriggerTypeInput): void

  /**
   * Registers a callback for a specific event.
   * @param event - The event to register the callback for
   * @param callback - The callback to register
   */
  on(event: string, callback: (arg?: unknown) => void): void

  /**
   * Creates a streaming channel pair for worker-to-worker data transfer.
   * Returns a Channel with a local writer/reader and serializable refs that
   * can be passed as fields in the invocation data to other functions.
   *
   * @param bufferSize - Optional buffer size for the channel (default: 64)
   * @returns A Channel with writer, reader, and their serializable refs
   */
  createChannel(bufferSize?: number): Promise<Channel>

  /**
   * Creates a new stream implementation.
   *
   * This overrides the default stream implementation.
   *
   * @param streamName - The name of the stream
   * @param stream - The stream implementation
   */
  createStream<TData>(streamName: string, stream: IStream<TData>): void

  /**
   * Registers a callback to receive the current functions list
   * when the engine announces changes.
   */
  onFunctionsAvailable(callback: FunctionsAvailableCallback): () => void

  /**
   * Registers a callback to receive OTEL log events from the engine.
   * @param callback - The callback to invoke when a log event is received
   * @param config - Optional configuration for filtering logs by severity level
   * @returns A function to unregister the callback
   */
  onLog(callback: LogCallback, config?: LogConfig): () => void

  /**
   * Gracefully shutdown the iii, cleaning up all resources.
   */
  shutdown(): Promise<void>
}

export type Trigger = {
  unregister(): void
}

export type FunctionRef = {
  id: string
  unregister: () => void
}

export type Channel = {
  writer: ChannelWriter
  reader: ChannelReader
  writerRef: StreamChannelRef
  readerRef: StreamChannelRef
}

export type InternalHttpRequest<TBody = unknown> = {
  path_params: Record<string, string>
  query_params: Record<string, string | string[]>
  body: TBody
  headers: Record<string, string | string[]>
  method: string
  response: ChannelWriter
  request_body: ChannelReader
}

export type HttpResponse = {
  status: (statusCode: number) => void
  headers: (headers: Record<string, string>) => void
  stream: NodeJS.WritableStream
  close: () => void
}

export type HttpRequest<TBody = unknown> = Omit<InternalHttpRequest<TBody>, 'response'>
export type ApiRequest<TBody = unknown> = HttpRequest<TBody>

export type ApiResponse<
  TStatus extends number = number,
  TBody = string | Buffer | Record<string, unknown>,
> = {
  status_code: TStatus
  headers?: Record<string, string>
  body?: TBody
}
