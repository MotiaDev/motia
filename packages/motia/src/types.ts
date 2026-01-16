import type { Logger } from '@iii-dev/sdk'
import type { ZodArray, ZodObject } from 'zod'
import * as z from 'zod'
import type { JsonSchema } from './types/schema.types'

// biome-ignore lint/suspicious/noExplicitAny: we need to define this type to avoid type errors
export type ZodInput = ZodObject<any> | ZodArray<any>

export type TypedJsonSchema<T = unknown> = JsonSchema & { readonly __phantomType?: T }

export type StepSchemaInput = ZodInput | JsonSchema | TypedJsonSchema<unknown>

export function jsonSchema<T extends z.ZodType>(schema: T): TypedJsonSchema<z.output<T>> {
  return z.toJSONSchema(schema, { target: 'draft-7' }) as TypedJsonSchema<z.output<T>>
}

export type InternalStateManager = {
  get<T>(groupId: string, key: string): Promise<T | null>
  set<T>(groupId: string, key: string, value: T): Promise<T>
  delete<T>(groupId: string, key: string): Promise<T | null>
  getGroup<T>(groupId: string): Promise<T[]>
  clear(groupId: string): Promise<void>
}

export type EmitData<T = unknown> = { topic: string; data: T; messageGroupId?: string }
export type Emitter<TData> = (event: TData) => Promise<void>

export interface FlowContext<TEmitData = never> {
  emit: Emitter<TEmitData>
  traceId: string
  state: InternalStateManager
  logger: Logger
  streams: Streams
  trigger: TriggerInfo
}

export type Emit = string | { topic: string; label?: string; conditional?: boolean }

export type TriggerInfo = {
  type: 'api' | 'event' | 'cron'
  index?: number
  path?: string
  method?: string
  topic?: string
  expression?: string
}

type EventTriggerInput<T> = T

type ApiTriggerInput<T> = ApiRequest<T>

type CronTriggerInput = undefined

export type TriggerInput<T> = EventTriggerInput<T> | ApiTriggerInput<T> | CronTriggerInput

export type TriggerCondition<TInput = unknown> = (
  input: TriggerInput<TInput>,
  ctx: Omit<FlowContext, 'emit'>,
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
  ctx: FlowContext<TEmitData>,
  next: () => Promise<ApiResponse<number, TResult>>,
) => Promise<ApiResponse<number, TResult>>

export interface QueryParam {
  name: string
  description: string
}

export type EventTrigger<TSchema extends StepSchemaInput | undefined = any> = {
  type: 'event'
  topic: string
  input?: TSchema
  condition?: TriggerCondition<InferSchema<TSchema>>
}

export type ApiTrigger<TSchema extends StepSchemaInput | undefined = any> = {
  type: 'api'
  path: string
  method: ApiRouteMethod
  bodySchema?: TSchema
  responseSchema?: Record<number, StepSchemaInput>
  queryParams?: readonly QueryParam[]
  // biome-ignore lint/suspicious/noExplicitAny: we need to define this type to avoid type errors
  middleware?: readonly ApiMiddleware<any, any, any>[]
  condition?: TriggerCondition<InferSchema<TSchema>>
}

export type CronTrigger<TSchema extends StepSchemaInput | undefined = any> = {
  type: 'cron'
  expression: string
  input?: never
  condition?: TriggerCondition<InferSchema<TSchema>>
}

export type TriggerConfig = EventTrigger | ApiTrigger | CronTrigger

export type StepConfig<TTriggers extends readonly any[] = readonly TriggerConfig[]> = {
  name: string
  description?: string
  triggers: TTriggers
  emits?: readonly Emit[]
  virtualEmits?: readonly Emit[]
  virtualSubscribes?: readonly string[]
  flows?: readonly string[]
  includeFiles?: readonly string[]
  infrastructure?: Partial<InfrastructureConfig>
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
  ctx: FlowContext<TEmitData>,
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

export type Step = { filePath: string; config: StepConfig<any> }

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

type HasOutput = { _output: unknown }

type InferSchema<T, TFallback = unknown> = T extends TypedJsonSchema<infer O>
  ? O
  : T extends HasOutput
    ? T['_output']
    : T extends undefined
      ? unknown
      : TFallback

type TriggerToInput<TTrigger> = TTrigger extends { type: 'event'; input?: infer S }
  ? S extends StepSchemaInput
    ? InferSchema<S>
    : unknown
  : TTrigger extends { type: 'api'; bodySchema?: infer S }
    ? ApiRequest<S extends StepSchemaInput ? InferSchema<S> : unknown>
    : TTrigger extends { type: 'cron'; input?: never }
      ? undefined
      : never

type InferHandlerInput<TConfig extends StepConfig<any>> = TConfig['triggers'][number] extends infer T
  ? TriggerToInput<T>
  : never

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

export type Handlers<TConfig extends StepConfig<any>> = (
  input: InferHandlerInput<TConfig>,
  ctx: FlowContext<InferEmits<TConfig>>,
) => InferReturnType
