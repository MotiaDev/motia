import { z, ZodArray, ZodObject } from 'zod'
import { Logger } from './logger'
import { Tracer } from './observability'

export type ZodInput = ZodObject<any> | ZodArray<any> // eslint-disable-line @typescript-eslint/no-explicit-any

export type InternalStateManager = {
  get<T>(groupId: string, key: string): Promise<T | null>
  set<T>(groupId: string, key: string, value: T): Promise<T>
  delete<T>(groupId: string, key: string): Promise<T | null>
  getGroup<T>(groupId: string): Promise<T[]>
  clear(groupId: string): Promise<void>
  atomicUpdate?<T>(groupId: string, key: string, updateFn: (current: T | null) => T): Promise<T>
}

export type EmitData = { topic: ''; data: unknown }
export type Emitter<TData> = (event: TData) => Promise<void>

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FlowContextStateStreams {}

export interface FlowContext<TEmitData = never> {
  emit: Emitter<TEmitData>
  traceId: string
  state: InternalStateManager
  logger: Logger
  streams: FlowContextStateStreams
}

export type EventHandler<TInput, TEmitData> = (input: TInput, ctx: FlowContext<TEmitData>) => Promise<void>

export type Emit = string | { topic: string; label?: string; conditional?: boolean }

// Base trigger interface
export interface BaseTrigger {
  type: string
  description?: string
}

// Event trigger for subscribing to events
export interface EventTrigger extends BaseTrigger {
  type: 'event'
  topic: string
  condition?: (data: any) => boolean // Function to evaluate the trigger
}

// API trigger for HTTP endpoints
export interface ApiTrigger extends BaseTrigger {
  type: 'api'
  path: string
  method: ApiRouteMethod
}

// Cron trigger for scheduled tasks
export interface CronTrigger extends BaseTrigger {
  type: 'cron'
  cron: string
}

// State trigger for state-based conditions
export interface StateTrigger extends BaseTrigger {
  type: 'state'
  key: string
  condition?: ((input: any, state: InternalStateManager) => boolean) | string
}

// Union type for all trigger types
export type Trigger = EventTrigger | ApiTrigger | CronTrigger | StateTrigger

export type ApiRouteMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'

export type ApiMiddleware<TBody = unknown, TEmitData = never, TResult = unknown> = (
  req: ApiRequest<TBody>,
  ctx: FlowContext<TEmitData>,
  next: () => Promise<ApiResponse<number, TResult>>,
) => Promise<ApiResponse<number, TResult>>

export interface QueryParam {
  name: string
  description: string
}

// Unified StepConfig that replaces all previous config types
export interface StepConfig {
  name: string
  description?: string
  triggers: Trigger[]
  emits?: Emit[]
  // Optional attributes for different trigger types
  path?: string
  method?: ApiRouteMethod
  cron?: string
  virtualEmits?: Emit[]
  virtualSubscribes?: string[]
  input?: ZodInput
  bodySchema?: ZodInput // For API steps
  responseSchema?: Record<number, ZodInput>
  queryParams?: QueryParam[]
  middleware?: ApiMiddleware<any, any, any>[] // eslint-disable-line @typescript-eslint/no-explicit-any
  flows?: string[]
  /**
   * Files to include in the step bundle.
   * Needs to be relative to the step file.
   */
  includeFiles?: string[]
  // Legacy properties for backward compatibility
  type?: string // Deprecated: use triggers array instead
  subscribes?: string[] // Deprecated: use triggers array instead
}

export interface ApiRequest<TBody = unknown> {
  pathParams: Record<string, string>
  queryParams: Record<string, string | string[]>
  body: TBody
  headers: Record<string, string | string[]>
}

export type ApiResponse<TStatus extends number = number, TBody = string | Buffer | Record<string, unknown>> = {
  status: TStatus
  headers?: Record<string, string>
  body: TBody
}

export type ApiRouteHandler<
  TRequestBody = unknown,
  TResponseBody extends ApiResponse<number, unknown> = ApiResponse<number, unknown>,
  TEmitData = never,
> = (req: ApiRequest<TRequestBody>, ctx: FlowContext<TEmitData>) => Promise<TResponseBody>

export type CronHandler<TEmitData = never> = (ctx: FlowContext<TEmitData>) => Promise<void>

/**
 * @deprecated Use `Handlers` instead.
 */
export type StepHandler<T> = T extends StepConfig
  ? EventHandler<T['input'] extends z.ZodType<any, any, any> ? z.infer<T['input']> : any, { topic: string; data: any }> // eslint-disable-line @typescript-eslint/no-explicit-any
  | ApiRouteHandler<any, ApiResponse<number, any>, { topic: string; data: any }> // eslint-disable-line @typescript-eslint/no-explicit-any
  | CronHandler<{ topic: string; data: any }> // eslint-disable-line @typescript-eslint/no-explicit-any
  : never

export type Event<TData = unknown> = {
  topic: string
  data: TData
  traceId: string
  flows?: string[]
  logger: Logger
  tracer: Tracer
}

export type Handler<TData = unknown> = (event: Event<TData>) => Promise<void>

export type SubscribeConfig<TData> = {
  event: string
  handlerName: string
  filePath: string
  handler: Handler<TData>
}

export type UnsubscribeConfig = {
  filePath: string
  event: string
}

export type EventManager = {
  emit: <TData>(event: Event<TData>, file?: string) => Promise<void>
  subscribe: <TData>(config: SubscribeConfig<TData>) => void
  unsubscribe: (config: UnsubscribeConfig) => void
}

export type Step<TConfig extends StepConfig = StepConfig> = { filePath: string; version: string; config: TConfig }

export type Flow = {
  name: string
  description?: string
  steps: Step[]
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Handlers {}
