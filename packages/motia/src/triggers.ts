import type {
  ApiMiddleware,
  ApiRouteMethod,
  ApiTrigger,
  CronTrigger,
  EventTrigger,
  InfrastructureConfig,
  QueryParam,
  StepSchemaInput,
  TriggerCondition,
} from './types'

type ApiOptions<TSchema extends StepSchemaInput | undefined = undefined> = {
  bodySchema?: TSchema
  responseSchema?: Record<number, StepSchemaInput>
  queryParams?: readonly QueryParam[]
  // biome-ignore lint/suspicious/noExplicitAny: we need to define this type to avoid type errors
  middleware?: readonly ApiMiddleware<any, any, any>[]
}

type EventOptions<TSchema extends StepSchemaInput | undefined = undefined> = {
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
export function event<TOptions extends EventOptions<any> | undefined = undefined>(
  topic: string,
  options?: TOptions,
  condition?: TriggerCondition,
): EventTrigger<TOptions extends EventOptions<infer S> ? S : undefined> {
  // biome-ignore lint/suspicious/noExplicitAny: runtime return is correct, cast needed for flexible type
  return { type: 'event', topic, ...options, condition } as any
}

export function cron(expression: string, condition?: TriggerCondition): CronTrigger {
  return { type: 'cron', expression, condition }
}
