import type { Logger, StreamSetResult, UpdateOp } from '@iii-dev/sdk'
import type { FromSchema } from 'json-schema-to-ts'
import type { ZodType } from 'zod'
import * as z from 'zod'
import type { JsonSchema } from './types/schema.types'

// biome-ignore lint/suspicious/noExplicitAny: we need to define this type to avoid type errors
export type ZodInput = ZodType<any, any, any>

export type TypedJsonSchema<T = unknown> = JsonSchema & { readonly __phantomType?: T }

export type StepSchemaInput = ZodInput | JsonSchema | TypedJsonSchema<unknown>

export function jsonSchema<T extends z.ZodType>(schema: T): TypedJsonSchema<z.output<T>> {
  return z.toJSONSchema(schema, { target: 'draft-7' }) as TypedJsonSchema<z.output<T>>
}

export type InternalStateManager = {
  get<T>(groupId: string, key: string): Promise<T | null>
  set<T>(groupId: string, key: string, value: T): Promise<StreamSetResult<T> | null>
  update<T>(groupId: string, key: string, ops: UpdateOp[]): Promise<StreamSetResult<T> | null>
  delete<T>(groupId: string, key: string): Promise<T | null>
  getGroup<T>(groupId: string): Promise<T[]>
  clear(groupId: string): Promise<void>
}

export type EmitData<T = unknown> = { topic: string; data: T; messageGroupId?: string }
export type Emitter<TData> = (event: TData) => Promise<void>

export type ExtractEventInput<TInput> = Exclude<Exclude<TInput, ApiRequest>, undefined>
export type ExtractApiInput<TInput> = Extract<TInput, ApiRequest>
export type ExtractStateInput<TInput> = Extract<TInput, StateTriggerInput<unknown>>
export type ExtractStreamInput<TInput> = Extract<TInput, StreamTriggerInput<unknown>>
export type ExtractDataPayload<TInput> =
  TInput extends ApiRequest<infer TBody> ? TBody : TInput extends undefined ? undefined : TInput

export type MatchHandlers<TInput, TEmitData, TResult> = {
  event?: (input: ExtractEventInput<TInput>) => Promise<void>

  api?: (request: ExtractApiInput<TInput>) => Promise<TResult>

  cron?: () => Promise<void>

  state?: (input: ExtractStateInput<TInput>) => Promise<TResult>

  stream?: (input: ExtractStreamInput<TInput>) => Promise<TResult>

  default?: (input: TInput) => Promise<TResult | void>
}

export interface FlowContext<TEmitData = never, TInput = unknown> {
  emit: Emitter<TEmitData>
  traceId: string
  state: InternalStateManager
  logger: Logger
  streams: Streams
  trigger: TriggerInfo

  is: {
    event: (input: TInput) => input is ExtractEventInput<TInput>
    api: (input: TInput) => input is ExtractApiInput<TInput>
    cron: (input: TInput) => input is never
    state: (input: TInput) => input is ExtractStateInput<TInput>
    stream: (input: TInput) => input is ExtractStreamInput<TInput>
  }

  /**
   * Extracts the data payload from the input, regardless of trigger type.
   * Useful when multiple triggers (e.g., event and API) share the same data schema.
   *
   * - For API triggers: returns `request.body`
   * - For event triggers: returns the event data directly
   * - For cron triggers: returns `undefined`
   *
   * @example
   * ```ts
   * // When event and API triggers have the same schema
   * const orderData = ctx.getData() // Works for both triggers
   * ```
   */
  getData: () => ExtractDataPayload<TInput>

  match: <TResult = any>(handlers: MatchHandlers<TInput, TEmitData, TResult>) => Promise<TResult | void>
}

export type Emit = string | { topic: string; label?: string; conditional?: boolean }

type TriggerType = 'api' | 'event' | 'cron' | 'state' | 'stream'

export type TriggerInfo = {
  type: TriggerType
  index?: number
  path?: string
  method?: string
  topic?: string
  expression?: string
}

type EventTriggerInput<T> = T

type ApiTriggerInput<T> = ApiRequest<T>

type CronTriggerInput = undefined

export type StateTriggerInput<T> = {
  type: 'state'
  group_id: string
  item_id: string
  old_value?: T
  new_value?: T
}

export type StreamEvent<TData> =
  | { type: 'create'; data: TData }
  | { type: 'update'; data: TData }
  | { type: 'delete'; data: TData }

export type StreamTriggerInput<T> = {
  type: 'stream'
  timestamp: number
  streamName: string
  groupId: string
  id: string
  event: StreamEvent<T>
}

export type TriggerInput<T> =
  | EventTriggerInput<T>
  | ApiTriggerInput<T>
  | CronTriggerInput
  | StateTriggerInput<T>
  | StreamTriggerInput<T>

export type TriggerCondition<TInput = unknown> = (
  input: TriggerInput<TInput>,
  ctx: FlowContext<never, TriggerInput<TInput>>,
) => boolean | Promise<boolean>

export type HandlerConfig = {
  ram: number
  cpu?: number
  timeout: number
}

export type QueueConfig = {
  type: 'fifo' | 'standard'
  maxRetries: number
  visibilityTimeout: number
  delaySeconds: number
}

export type InfrastructureConfig = {
  handler?: Partial<HandlerConfig>
  queue?: Partial<QueueConfig>
}

export type ApiRouteMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'

export type ApiMiddleware<TBody = unknown, TEmitData = never, TResult = unknown> = (
  req: ApiRequest<TBody>,
  ctx: FlowContext<TEmitData, ApiRequest<TBody>>,
  next: () => Promise<ApiResponse<number, TResult>>,
) => Promise<ApiResponse<number, TResult>>

export interface QueryParam {
  name: string
  description: string
}

// biome-ignore lint/suspicious/noExplicitAny: we need any to allow trigger assignment to TriggerConfig
export type StateTrigger<TSchema extends StepSchemaInput | undefined = any> = {
  type: 'state'
  condition?: TriggerCondition<InferSchema<TSchema>>
}

// biome-ignore lint/suspicious/noExplicitAny: we need any to allow trigger assignment to TriggerConfig
export type StreamTrigger<TSchema extends StepSchemaInput | undefined = any> = {
  type: 'stream'
  streamName: string
  groupId?: string
  itemId?: string
  condition?: TriggerCondition<InferSchema<TSchema>>
}

// biome-ignore lint/suspicious/noExplicitAny: we need any to allow trigger assignment to TriggerConfig
export type EventTrigger<TSchema extends StepSchemaInput | undefined = any> = {
  type: 'event'
  topic: string
  input?: TSchema
  condition?: TriggerCondition<TSchema extends ZodInput ? z.infer<TSchema> : unknown>
  infrastructure?: Partial<InfrastructureConfig>
}

// biome-ignore lint/suspicious/noExplicitAny: we need any to allow trigger assignment to TriggerConfig
export type ApiTrigger<TSchema extends StepSchemaInput | undefined = any> = {
  type: 'api'
  path: string
  method: ApiRouteMethod
  bodySchema?: TSchema
  responseSchema?: Record<number, StepSchemaInput>
  queryParams?: readonly QueryParam[]
  // biome-ignore lint/suspicious/noExplicitAny: we need to define this type to avoid type errors
  middleware?: readonly ApiMiddleware<any, any, any>[]
  condition?: TriggerCondition<TSchema extends ZodInput ? z.infer<TSchema> : unknown>
}

export type CronTrigger = {
  type: 'cron'
  expression: string
  input?: never
  condition?: TriggerCondition
}

export type TriggerConfig = EventTrigger | ApiTrigger | CronTrigger | StateTrigger | StreamTrigger

export type StepConfig = {
  name: string
  description?: string
  triggers: readonly TriggerConfig[]
  emits?: readonly Emit[]
  virtualEmits?: readonly Emit[]
  virtualSubscribes?: readonly string[]
  flows?: readonly string[]
  includeFiles?: readonly string[]
}

export interface ApiRequest<TBody = unknown> {
  pathParams: Record<string, string>
  queryParams: Record<string, string | string[]>
  body: TBody
  headers: Record<string, string | string[]>
}

export type ApiResponse<TStatus extends number = number, TBody = any> = {
  status: TStatus
  headers?: Record<string, string>
  body: TBody
}

export type StepHandler<TInput = any, TEmitData = never> = (
  input: TriggerInput<TInput>,
  ctx: FlowContext<TEmitData, TriggerInput<TInput>>,
) => Promise<ApiResponse | void>

export type Event<TData = unknown> = {
  topic: string
  data: TData
  traceId: string
  flows?: string[]
  logger: Logger
  messageGroupId?: string
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

export type Step = { filePath: string; config: StepConfig }

export type PluginStep = Step & {
  handler?: StepHandler<any, any>
}

export type Flow = {
  name: string
  description?: string
  steps: Step[]
}

// biome-ignore lint/suspicious/noEmptyInterface: we need to define this interface to avoid type errors
export interface Streams {}

// biome-ignore lint/suspicious/noEmptyInterface: we need to define this interface to avoid type errors
export interface Emits {}

// biome-ignore lint/suspicious/noExplicitAny: FromSchema requires flexible casting for JSON Schema inference
type InferSchema<T, TFallback = unknown> = T extends TypedJsonSchema<infer O>
  ? O
  : T extends ZodInput
    ? z.infer<T>
    : T extends { readonly type: string }
      ? FromSchema<T & { type: any }>
      : T extends { readonly anyOf: readonly any[] }
        ? FromSchema<T & { anyOf: any }>
        : T extends { readonly allOf: readonly any[] }
          ? FromSchema<T & { allOf: any }>
          : T extends { readonly oneOf: readonly any[] }
            ? FromSchema<T & { oneOf: any }>
            : T extends undefined
              ? unknown
              : TFallback

type TriggerToInput<TTrigger> = TTrigger extends { type: 'event'; input?: infer S }
  ? S extends ZodInput
    ? z.infer<S>
    : S extends StepSchemaInput
      ? InferSchema<S>
      : unknown
  : TTrigger extends { type: 'api'; bodySchema?: infer S }
    ? ApiRequest<S extends ZodInput ? z.infer<S> : S extends StepSchemaInput ? InferSchema<S> : unknown>
    : TTrigger extends { type: 'state' }
      ? StateTriggerInput<unknown>
      : TTrigger extends { type: 'stream' }
        ? StreamTriggerInput<unknown>
        : TTrigger extends { type: 'cron' }
          ? undefined
          : never

type InferHandlerInput<TConfig extends StepConfig> = TriggerToInput<TConfig['triggers'][number]>

type InferReturnType = Promise<ApiResponse | void>

type EmitTopic<T extends string> = T extends keyof Emits ? Emits[T] : unknown

type NormalizeEmit<E> = E extends string
  ? { topic: E }
  : E extends { topic: infer T extends string }
    ? { topic: T }
    : never

type EmitElement<E> =
  NormalizeEmit<E> extends { topic: infer T extends string } ? { topic: T; data: EmitTopic<T> } : never

type InferEmits<T> = T extends { emits: readonly unknown[] } ? EmitElement<T['emits'][number]> : never

export type Handlers<TConfig extends StepConfig> = (
  input: InferHandlerInput<TConfig>,
  ctx: FlowContext<InferEmits<TConfig>, InferHandlerInput<TConfig>>,
) => InferReturnType
