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
  FlowContext,
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

const composeMiddleware = <TRequestBody = unknown, TEmitData = never, TResponseBody = unknown>(
  ...middlewares: ApiMiddleware<TRequestBody, TEmitData, TResponseBody>[]
) => {
  return async (
    req: MotiaApiRequest<TRequestBody>,
    ctx: FlowContext<TEmitData>,
    handler: () => Promise<MotiaApiResponse<number, TResponseBody>>,
  ): Promise<MotiaApiResponse<number, TResponseBody>> => {
    const composedHandler = middlewares.reduceRight<() => Promise<MotiaApiResponse<number, TResponseBody>>>(
      (nextHandler, middleware) => () => middleware(req, ctx, nextHandler),
      handler,
    )

    return composedHandler()
  }
}

const flowContext = <EmitData>(streamManager: Motia, trigger: TriggerInfo): FlowContext<EmitData> => {
  const traceId = crypto.randomUUID()
  const { logger } = getContext()
  const emit: Emitter<EmitData> = async (event: EmitData): Promise<void> => bridge.invokeFunction('emit', event)
  const state = new StateManager()

  return { emit, traceId, state, logger, streams: streamManager.streams, trigger }
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
          async (req: IIIApiRequest<any>): Promise<IIIApiResponse> => {
            const triggerInfo: TriggerInfo = { type: 'api', index }
            const context = flowContext(this, triggerInfo)
            const motiaRequest: MotiaApiRequest<unknown> = {
              pathParams: req.path_params || {},
              queryParams: req.query_params || {},
              body: req.body,
              headers: req.headers || {},
            }

            const middlewares = Array.isArray(trigger?.middleware) ? trigger.middleware : []

            const composedMiddleware = composeMiddleware(...middlewares)
            const handlerFn = async () => step.handler(motiaRequest, context)
            const response: MotiaApiResponse = await composedMiddleware(motiaRequest, context, handlerFn)

            return {
              status_code: response.status,
              headers: response.headers,
              body: response.body,
            }
          },
        )

        const apiPath = trigger.path.startsWith('/') ? trigger.path.substring(1) : trigger.path
        const triggerConfig: Record<string, any> = {
          api_path: apiPath,
          http_method: trigger.method,
          metadata,
        }

        if (trigger.condition) {
          const conditionPath = `${function_path}.conditions:${index}`

          bridge.registerFunction(
            { function_path: conditionPath },
            async (req: IIIApiRequest<any>): Promise<unknown> => {
              const triggerInfo: TriggerInfo = { type: 'api', index }
              const context = flowContext(this, triggerInfo)
              delete (context as any).emit

              const motiaRequest: MotiaApiRequest<unknown> = {
                pathParams: req.path_params || {},
                queryParams: req.query_params || {},
                body: req.body,
                headers: req.headers || {},
              }

              return trigger.condition!(motiaRequest, context)
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
          const context = flowContext(this, triggerInfo)
          return step.handler(req, context)
        })

        const triggerConfig: Record<string, any> = {
          topic: trigger.topic,
          metadata,
        }

        if (trigger.condition) {
          const conditionPath = `${function_path}.conditions:${index}`

          bridge.registerFunction({ function_path: conditionPath }, async (input) => {
            const triggerInfo: TriggerInfo = { type: 'event', index }
            const { emit, ...context } = flowContext(this, triggerInfo)

            return trigger.condition!(input, context as FlowContext<unknown>)
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
          const context = flowContext(this, triggerInfo)
          return step.handler(undefined, context)
        })

        const triggerConfig: Record<string, any> = {
          expression: trigger.expression,
          metadata,
        }

        if (trigger.condition) {
          const conditionPath = `${function_path}.conditions:${index}`

          bridge.registerFunction({ function_path: conditionPath }, async () => {
            const triggerInfo: TriggerInfo = { type: 'cron', index }
            const { emit, ...context } = flowContext(this, triggerInfo)
            return trigger.condition!(undefined, context as FlowContext<unknown>)
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
