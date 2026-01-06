import {
  getContext,
  type ApiRequest as IIIApiRequest,
  type ApiResponse as IIIApiResponse,
  type StreamAuthInput,
  type StreamJoinLeaveEvent,
} from '@iii-dev/sdk'
import { isApiStep, isCronStep, isEventStep } from '../../guards'
import { Printer } from '../../printer'
import type {
  ApiMiddleware,
  ApiRouteHandler,
  CronHandler,
  Emitter,
  FlowContext,
  ApiRequest as MotiaApiRequest,
  ApiResponse as MotiaApiResponse,
  Step,
  StepConfig,
  StepHandler,
} from '../../types'
import type { AuthenticateStream, StreamAuthInput as MotiaStreamAuthInput, StreamConfig } from '../../types-stream'
import { bridge } from '../bridge'
import { setupStepEndpoint } from '../setup-step-endpoint'
import { StateManager } from '../state'
import { Stream } from '../streams'

const printer = new Printer(process.cwd())

type StepWithHandler = Step & { handler: StepHandler<any> }

const composeMiddleware = <TRequestBody = unknown, TResponseBody = unknown>(
  ...middlewares: ApiMiddleware<TRequestBody, any, TResponseBody>[]
) => {
  return async (req: any, ctx: any, handler: () => Promise<any>): Promise<any> => {
    const composedHandler = middlewares.reduceRight<() => Promise<any>>(
      (nextHandler, middleware) => () => middleware(req, ctx, nextHandler),
      handler,
    )

    return composedHandler()
  }
}

const flowContext = <EmitData>(streamManager: Motia): FlowContext<EmitData> => {
  const traceId = crypto.randomUUID()
  const { logger } = getContext()
  const emit: Emitter<EmitData> = async (event: EmitData): Promise<void> => bridge.invokeFunction('emit', event)
  const state = new StateManager()

  return { emit, traceId, state, logger, streams: streamManager.streams }
}

export class Motia {
  public streams: Record<string, Stream<any>> = {}
  private authenticateStream: AuthenticateStream | undefined

  public addStep(config: StepConfig, stepPath: string, handler: StepHandler<any>, filePath: string) {
    const step: StepWithHandler = { config, handler, filePath: stepPath }
    const function_path = `steps.${step.config.name}`

    printer.printStepCreated(step)

    const metadata = { ...(step.config as Record<string, any>), filePath }

    if (isApiStep(step)) {
      bridge.registerFunction({ function_path, metadata }, async (req: IIIApiRequest<any>): Promise<IIIApiResponse> => {
        const context = flowContext(this)

        const motiaReq: MotiaApiRequest<any> = {
          pathParams: req.path_params,
          queryParams: req.query_params,
          body: req.body,
          headers: req.headers,
        }

        const middlewares = Array.isArray(step.config.middleware) ? step.config.middleware : []
        const handler = composeMiddleware(...middlewares)
        const handlerFn = async () => {
          const stepHandler = step.handler as ApiRouteHandler<any, MotiaApiResponse, any>
          return stepHandler(motiaReq, context)
        }
        const response: MotiaApiResponse = await handler(motiaReq, context, handlerFn)

        return {
          status_code: response.status,
          headers: response.headers,
          body: response.body,
        }
      })
    } else if (isCronStep(step)) {
      bridge.registerFunction({ function_path, metadata }, async () => {
        return (step.handler as CronHandler<any>)(flowContext(this))
      })
    } else {
      bridge.registerFunction({ function_path, metadata }, async (req) => {
        return step.handler(req, flowContext(this))
      })
    }

    if (isApiStep(step)) {
      const apiPath = step.config.path.startsWith('/') ? step.config.path.substring(1) : step.config.path

      bridge.registerTrigger({
        trigger_type: 'api',
        function_path,
        config: {
          api_path: apiPath,
          http_method: step.config.method,
          metadata,
        },
      })
    } else if (isEventStep(step)) {
      step.config.subscribes.forEach((topic) => {
        bridge.registerTrigger({
          trigger_type: 'event',
          function_path,
          config: { topic, metadata },
        })
      })
    } else if (isCronStep(step)) {
      bridge.registerTrigger({
        trigger_type: 'cron',
        function_path,
        config: {
          expression: step.config.cron,
          metadata,
        },
      })
    }
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
          const context = flowContext<any>(this)
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
        const context = flowContext<any>(this)

        if (stream?.config.onJoin) {
          return stream.config.onJoin({ groupId: group_id, id }, context, authContext)
        }
      })

      bridge.registerTrigger({ trigger_type: 'streams:join', function_path, config: {} })
    }

    if (hasLeave) {
      const function_path = 'motia.streams.leave'

      bridge.registerFunction({ function_path }, async (req: StreamJoinLeaveEvent) => {
        const { stream_name, group_id, id, context: authContext } = req
        const stream = this.streams[stream_name]
        const context = flowContext<unknown>(this)

        if (stream?.config.onLeave) {
          await stream.config.onLeave({ groupId: group_id, id }, context, authContext)
        }
      })

      bridge.registerTrigger({ trigger_type: 'streams:leave', function_path, config: {} })
    }
  }
}
