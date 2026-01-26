import type {
  ApiRequest as IIIApiRequest,
  ApiResponse as IIIApiResponse,
  StreamAuthInput,
  StreamJoinLeaveEvent,
} from '@iii-dev/sdk'
import { getContext } from '@iii-dev/sdk'
import { isApiTrigger, isCronTrigger, isEventTrigger } from '../../guards'
import { Printer } from '../../printer'
import type {
  ApiMiddleware,
  ApiTrigger,
  CronTrigger,
  Emitter,
  EventTrigger,
  ExtractApiInput,
  ExtractDataPayload,
  ExtractEventInput,
  FlowContext,
  MatchHandlers,
  ApiRequest as MotiaApiRequest,
  ApiResponse as MotiaApiResponse,
  Step,
  StepConfig,
  StepHandler,
  TriggerInfo,
} from '../../types'
import type { AuthenticateStream, StreamAuthInput as MotiaStreamAuthInput, StreamConfig } from '../../types-stream'
import { bridge } from '../bridge'
import { setupStepEndpoint } from '../setup-step-endpoint'
import { StateManager } from '../state'
import { Stream } from '../streams'

const printer = new Printer(process.cwd())

type StepWithHandler = Step & { handler: StepHandler<unknown> }

type TriggerConfigBase = {
  metadata: StepConfig & { filePath: string }
  _condition_path?: string
}

type ApiTriggerConfig = TriggerConfigBase & {
  api_path: string
  http_method: string
}

type EventTriggerConfig = TriggerConfigBase & {
  topic: string
}

type CronTriggerConfig = TriggerConfigBase & {
  expression: string
}

const composeMiddleware = <TRequestBody = unknown, TEmitData = never, TResponseBody = unknown>(
  ...middlewares: ApiMiddleware<TRequestBody, TEmitData, TResponseBody>[]
) => {
  return async (
    req: MotiaApiRequest<TRequestBody>,
    ctx: FlowContext<TEmitData, MotiaApiRequest<TRequestBody>>,
    handler: () => Promise<MotiaApiResponse<number, TResponseBody>>,
  ): Promise<MotiaApiResponse<number, TResponseBody>> => {
    const composedHandler = middlewares.reduceRight<() => Promise<MotiaApiResponse<number, TResponseBody>>>(
      (nextHandler, middleware) => () => middleware(req, ctx, nextHandler),
      handler,
    )

    return composedHandler()
  }
}

const flowContext = <EmitData, TInput = unknown>(
  streamManager: Motia,
  trigger: TriggerInfo,
  input?: TInput,
): FlowContext<EmitData, TInput> => {
  const traceId = crypto.randomUUID()
  const { logger } = getContext()
  const emit: Emitter<EmitData> = async (event: EmitData): Promise<void> => bridge.invokeFunction('emit', event)
  const state = new StateManager()

  const context: FlowContext<EmitData, TInput> = {
    emit,
    traceId,
    state,
    logger,
    streams: streamManager.streams,
    trigger,

    is: {
      event: (inp: TInput): inp is ExtractEventInput<TInput> => trigger.type === 'event',
      api: (inp: TInput): inp is ExtractApiInput<TInput> => trigger.type === 'api',
      cron: (inp: TInput): inp is never => trigger.type === 'cron',
    },

    getData: (): ExtractDataPayload<TInput> => {
      if (trigger.type === 'api') {
        return (input as Extract<TInput, MotiaApiRequest>).body as ExtractDataPayload<TInput>
      }
      return input as ExtractDataPayload<TInput>
    },

    match: async <TResult = unknown>(handlers: MatchHandlers<TInput, EmitData, TResult>): Promise<TResult | void> => {
      if (trigger.type === 'event' && handlers.event) {
        return await handlers.event(input as ExtractEventInput<TInput>)
      }
      if (trigger.type === 'api' && handlers.api) {
        return await handlers.api(input as ExtractApiInput<TInput>)
      }
      if (trigger.type === 'cron' && handlers.cron) {
        return await handlers.cron()
      }
      if (handlers.default) {
        return await handlers.default(input as TInput)
      }

      logger.warn(`No handler matched for trigger type: ${trigger.type}`, {
        availableHandlers: Object.keys(handlers).filter((k) => k !== 'default'),
        triggerType: trigger.type,
      })

      throw new Error(
        `No handler matched for trigger type: ${trigger.type}. Available handlers: ${Object.keys(handlers).join(', ')}`,
      )
    },
  }

  return context
}

export class Motia {
  public streams: Record<string, Stream<unknown>> = {}
  private authenticateStream: AuthenticateStream | undefined

  public addStep(config: StepConfig, stepPath: string, handler: StepHandler<unknown>, filePath: string) {
    const step: StepWithHandler = { config, handler, filePath: stepPath }

    printer.printStepCreated(step)

    const metadata = { ...step.config, filePath }

    step.config.triggers.forEach((trigger: ApiTrigger | EventTrigger | CronTrigger, index: number) => {
      const function_path = `steps.${step.config.name}:trigger:${index}`

      if (isApiTrigger(trigger)) {
        bridge.registerFunction(
          { function_path, metadata },
          async (req: IIIApiRequest<unknown>): Promise<IIIApiResponse> => {
            const triggerInfo: TriggerInfo = { type: 'api', index }
            const motiaRequest: MotiaApiRequest<unknown> = {
              pathParams: req.path_params || {},
              queryParams: req.query_params || {},
              body: req.body,
              headers: req.headers || {},
            }
            const context = flowContext(this, triggerInfo, motiaRequest)

            const middlewares = Array.isArray(trigger?.middleware) ? trigger.middleware : []

            const composedMiddleware = composeMiddleware(...middlewares)
            const handlerFn = async (): Promise<MotiaApiResponse> => {
              const result = await step.handler(motiaRequest, context as any)
              return result || { status: 200, body: null }
            }
            const response: MotiaApiResponse = await composedMiddleware(motiaRequest, context as any, handlerFn)

            return {
              status_code: response.status,
              headers: response.headers,
              body: response.body,
            }
          },
        )

        const apiPath = trigger.path.startsWith('/') ? trigger.path.substring(1) : trigger.path
        const triggerConfig: ApiTriggerConfig = {
          api_path: apiPath,
          http_method: trigger.method,
          metadata,
        }

        if (trigger.condition) {
          const conditionPath = `${function_path}.conditions:${index}`

          bridge.registerFunction(
            { function_path: conditionPath },
            async (req: IIIApiRequest<unknown>): Promise<unknown> => {
              const triggerInfo: TriggerInfo = { type: 'api', index }
              const motiaRequest: MotiaApiRequest<unknown> = {
                pathParams: req.path_params || {},
                queryParams: req.query_params || {},
                body: req.body,
                headers: req.headers || {},
              }
              const { emit, ...contextWithoutEmit } = flowContext(this, triggerInfo, motiaRequest)

              return trigger.condition?.(motiaRequest, contextWithoutEmit as any)
            },
          )

          triggerConfig._condition_path = conditionPath
        }

        bridge.registerTrigger({
          trigger_type: 'api',
          function_path,
          config: triggerConfig,
        })
      } else if (isEventTrigger(trigger)) {
        bridge.registerFunction({ function_path, metadata }, async (req) => {
          const triggerInfo: TriggerInfo = { type: 'event', index }
          const context = flowContext(this, triggerInfo, req)
          return step.handler(req, context)
        })

        const triggerConfig: EventTriggerConfig = {
          topic: trigger.topic,
          metadata,
        }

        if (trigger.condition) {
          const conditionPath = `${function_path}.conditions:${index}`

          bridge.registerFunction({ function_path: conditionPath }, async (input: unknown) => {
            const triggerInfo: TriggerInfo = { type: 'event', index }
            const { emit, ...context } = flowContext(this, triggerInfo, input)

            return trigger.condition?.(input, context as any)
          })

          triggerConfig._condition_path = conditionPath
        }

        bridge.registerTrigger({
          trigger_type: 'event',
          function_path,
          config: triggerConfig,
        })
      } else if (isCronTrigger(trigger)) {
        bridge.registerFunction({ function_path, metadata }, async (_req): Promise<unknown> => {
          const triggerInfo: TriggerInfo = { type: 'cron', index }
          const context = flowContext(this, triggerInfo, undefined)
          return step.handler(undefined, context as any)
        })

        const triggerConfig: CronTriggerConfig = {
          expression: trigger.expression,
          metadata,
        }

        if (trigger.condition) {
          const conditionPath = `${function_path}.conditions:${index}`

          bridge.registerFunction({ function_path: conditionPath }, async () => {
            const triggerInfo: TriggerInfo = { type: 'cron', index }
            const { emit, ...contextWithoutEmit } = flowContext(this, triggerInfo, undefined)
            return trigger.condition?.(undefined, contextWithoutEmit as any)
          })

          triggerConfig._condition_path = conditionPath
        }

        bridge.registerTrigger({
          trigger_type: 'cron',
          function_path,
          config: triggerConfig,
        })
      }
    })
  }

  public addStream(config: StreamConfig, streamPath: string) {
    printer.printStreamCreated({ filePath: streamPath, config, hidden: false })
    this.streams[config.name] = new Stream<unknown>(config)
  }

  public initialize() {
    const hasJoin = Object.values(this.streams).some((stream) => stream.config.onJoin)
    const hasLeave = Object.values(this.streams).some((stream) => stream.config.onLeave)

    setupStepEndpoint(bridge)

    if (this.authenticateStream) {
      const function_path = 'motia.streams.authenticate'

      bridge.registerFunction({ function_path }, async (req: StreamAuthInput) => {
        if (this.authenticateStream) {
          const triggerInfo: TriggerInfo = { type: 'event' }
          const context = flowContext<never>(this, triggerInfo)
          const input: MotiaStreamAuthInput = {
            headers: req.headers,
            path: req.path,
            queryParams: req.query_params,
            addr: req.addr,
          }

          return this.authenticateStream(input, context)
        }
      })
    }

    if (hasJoin) {
      const function_path = 'motia.streams.join'

      bridge.registerFunction({ function_path }, async (req: StreamJoinLeaveEvent) => {
        const { stream_name, group_id, id, context: authContext } = req
        const stream = this.streams[stream_name]
        const triggerInfo: TriggerInfo = { type: 'event' }
        const context = flowContext<never>(this, triggerInfo)

        if (stream?.config.onJoin) {
          return stream.config.onJoin({ groupId: group_id, id }, context, authContext)
        }
      })

      bridge.registerTrigger({
        trigger_type: 'streams:join',
        function_path,
        config: {},
      })
    }

    if (hasLeave) {
      const function_path = 'motia.streams.leave'

      bridge.registerFunction({ function_path }, async (req: StreamJoinLeaveEvent) => {
        const { stream_name, group_id, id, context: authContext } = req
        const stream = this.streams[stream_name]
        const triggerInfo: TriggerInfo = { type: 'event' }
        const context = flowContext<unknown>(this, triggerInfo)

        if (stream?.config.onLeave) {
          await stream.config.onLeave({ groupId: group_id, id }, context, authContext)
        }
      })

      bridge.registerTrigger({
        trigger_type: 'streams:leave',
        function_path,
        config: {},
      })
    }
  }
}
