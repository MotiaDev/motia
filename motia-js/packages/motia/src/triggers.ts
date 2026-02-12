import type {
  ApiMiddleware,
  ApiRouteMethod,
  ApiTrigger,
  CronTrigger,
  InfrastructureConfig,
  QueryParam,
  QueueTrigger,
  StateTrigger,
  StepSchemaInput,
  StreamTrigger,
  TriggerCondition,
} from './types'

type ApiOptions<TSchema extends StepSchemaInput | undefined = undefined> = {
  bodySchema?: TSchema
  responseSchema?: Record<number, StepSchemaInput>
  queryParams?: readonly QueryParam[]
  // biome-ignore lint/suspicious/noExplicitAny: we need to define this type to avoid type errors
  middleware?: readonly ApiMiddleware<any, any, any>[]
}

type QueueOptions<TSchema extends StepSchemaInput | undefined = undefined> = {
  input?: TSchema
  infrastructure?: Partial<InfrastructureConfig>
}

// biome-ignore lint/suspicious/noExplicitAny: we need any to accept all schema types
export function api<TOptions extends ApiOptions<any> | undefined = undefined>(
  method: ApiRouteMethod,
  path: string,
  options?: TOptions,
  condition?: TriggerCondition,
): ApiTrigger<TOptions extends ApiOptions<infer S> ? S : undefined> {
  // biome-ignore lint/suspicious/noExplicitAny: runtime return is correct, cast needed for flexible type
  return { type: 'api', method, path, ...options, condition } as any
}

// biome-ignore lint/suspicious/noExplicitAny: we need any to accept all schema types
export function queue<TOptions extends QueueOptions<any> | undefined = undefined>(
  topic: string,
  options?: TOptions,
  condition?: TriggerCondition,
): QueueTrigger<TOptions extends QueueOptions<infer S> ? S : undefined> {
  // biome-ignore lint/suspicious/noExplicitAny: runtime return is correct, cast needed for flexible type
  return { type: 'queue', topic, ...options, condition } as any
}

export function cron(expression: string, condition?: TriggerCondition): CronTrigger {
  return { type: 'cron', expression, condition }
}

export function state(condition?: TriggerCondition): StateTrigger {
  return { type: 'state', condition }
}

export function stream(streamName: string, condition?: TriggerCondition): StreamTrigger {
  return { type: 'stream', streamName, condition }
}
