import bodyParser from 'body-parser'
import cors from 'cors'
import express, { type Express, type Request, type Response } from 'express'
import http from 'http'
import type { Server as WsServer } from 'ws'
import { trackEvent } from './analytics/utils'
import { analyticsEndpoint } from './analytics-endpoint'
import { callStepFile } from './call-step-file'
import { type CronManager, setupCronHandlers } from './cron-handler'
import { flowsConfigEndpoint } from './flows-config-endpoint'
import { flowsEndpoint } from './flows-endpoint'
import { generateTraceId } from './generate-trace-id'
import { isApiStep } from './guards'
import type { LockedData } from './locked-data'
import { globalLogger } from './logger'
import { BaseLoggerFactory } from './logger-factory'
import type { Motia } from './motia'
import { createTracerFactory } from './observability/tracer'
import { Printer } from './printer'
import { createSocketServer } from './socket-server'
import { stepEndpoint } from './step-endpoint'
import { createStepHandlers, type MotiaEventManager } from './step-handlers'
import { systemSteps } from './steps'
import { apiEndpoints } from './streams/api-endpoints'
import { type Log, LogsStream } from './streams/logs-stream'
import type {
  ApiRequest,
  ApiResponse,
  ApiRouteConfig,
  ApiRouteMethod,
  EventManager,
  InternalStateManager,
  Step,
} from './types'
import type { BaseStreamItem, MotiaStream, StateStreamEvent, StateStreamEventChannel } from './types-stream'

export type MotiaServer = {
  app: Express
  server: http.Server
  socketServer: WsServer
  close: () => Promise<void>
  removeRoute: (step: Step<ApiRouteConfig>) => void
  addRoute: (step: Step<ApiRouteConfig>) => void
  cronManager: CronManager
  motiaEventManager: MotiaEventManager
}

type MotiaServerConfig = {
  isVerbose: boolean
  printer?: Printer
}

export const createServer = (
  lockedData: LockedData,
  eventManager: EventManager,
  state: InternalStateManager,
  config: MotiaServerConfig,
): MotiaServer => {
  const printer = config.printer ?? new Printer(process.cwd())
  const app = express()
  const server = http.createServer(app)

  const { pushEvent, socketServer } = createSocketServer({
    server,
    onJoin: async (streamName: string, groupId: string, id: string) => {
      const streams = lockedData.getStreams()
      const stream = streams[streamName]

      if (stream) {
        const result = await stream().get(groupId, id)
        delete result?.__motia // deleting because we don't need it in the socket
        return result
      }
    },
    onJoinGroup: async (streamName: string, groupId: string) => {
      const streams = lockedData.getStreams()
      const stream = streams[streamName]

      if (stream) {
        const result = stream ? await stream().getGroup(groupId) : []
        // biome-ignore lint/suspicious/noUnusedVariables: migration
        return result.map(({ __motia, ...rest }) => rest)
      }
    },
  })

  lockedData.applyStreamWrapper((streamName, stream) => {
    return (): MotiaStream<BaseStreamItem> => {
      const main = stream() as MotiaStream<BaseStreamItem>
      /* biome-ignore lint/suspicious/noExplicitAny: migration */
      const wrapObject = (groupId: string, id: string, object: any) => {
        if (!object) {
          return null
        }

        return {
          ...object,
          __motia: { type: 'state-stream', streamName, groupId, id },
        }
      }

      const mainGetGroup = main.getGroup
      const mainGet = main.get
      const mainSet = main.set
      const mainDelete = main.delete

      main.send = async <T>(channel: StateStreamEventChannel, event: StateStreamEvent<T>) => {
        pushEvent({ streamName, ...channel, event: { type: 'event', event } })
      }

      main.getGroup = async (groupId: string) => {
        const result = await mainGetGroup.apply(main, [groupId])
        return result.map((object: BaseStreamItem) => wrapObject(groupId, object.id, object))
      }

      main.get = async (groupId: string, id: string) => {
        const result = await mainGet.apply(main, [groupId, id])
        return wrapObject(groupId, id, result)
      }

      main.set = async (groupId: string, id: string, data: BaseStreamItem) => {
        if (!data) {
          return null
        }

        const exists = await main.get(groupId, id)
        const updated = await mainSet.apply(main, [groupId, id, data])
        const result = updated ?? data
        const wrappedResult = wrapObject(groupId, id, result)

        const type = exists ? 'update' : 'create'
        pushEvent({ streamName, groupId, id, event: { type, data: result } })

        return wrappedResult
      }

      main.delete = async (groupId: string, id: string) => {
        const result = await mainDelete.apply(main, [groupId, id])

        pushEvent({
          streamName,
          groupId,
          id,
          event: { type: 'delete', data: result },
        })

        return wrapObject(groupId, id, result)
      }

      return main
    }
  })

  const logStream = lockedData.createStream<Log>({
    filePath: '__motia.logs',
    hidden: true,
    config: {
      name: '__motia.logs',
      baseConfig: { storageType: 'custom', factory: () => new LogsStream() },
      schema: null as never,
    },
  })()

  const allSteps = [...systemSteps, ...lockedData.activeSteps]
  const loggerFactory = new BaseLoggerFactory(config.isVerbose, logStream)
  const tracerFactory = createTracerFactory(lockedData)
  const motia: Motia = {
    loggerFactory,
    eventManager,
    state,
    lockedData,
    printer,
    tracerFactory,
  }

  const cronManager = setupCronHandlers(motia)
  const motiaEventManager = createStepHandlers(motia)

  const asyncHandler = (step: Step<ApiRouteConfig>) => {
    return async (req: Request, res: Response) => {
      const traceId = generateTraceId()
      const { name: stepName, flows } = step.config
      const logger = loggerFactory.create({ traceId, flows, stepName })
      const tracer = await motia.tracerFactory.createTracer(traceId, step, logger)

      logger.debug('[API] Received request, processing step', {
        path: req.path,
      })

      const data: ApiRequest = {
        body: req.body,
        headers: req.headers as Record<string, string | string[]>,
        pathParams: req.params,
        queryParams: req.query as Record<string, string | string[]>,
      }

      try {
        const result = await callStepFile<ApiResponse>({ data, step, logger, tracer, traceId }, motia)

        trackEvent('api_call_success', { stepName })

        if (!result) {
          console.log('no result')
          res.status(500).json({ error: 'Internal server error' })
          return
        }

        if (result.headers) {
          Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value))
        }

        res.status(result.status)
        res.json(result.body)
      } catch (error) {
        trackEvent('api_call_error', {
          stepName,
          traceId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        logger.error('[API] Internal server error', { error })
        console.log(error)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  const router = express.Router()

  const addRoute = (step: Step<ApiRouteConfig>) => {
    const { method, path } = step.config
    globalLogger.debug('[API] Registering route', step.config)

    const handler = asyncHandler(step)
    const methods: Record<ApiRouteMethod, () => void> = {
      GET: () => router.get(path, handler),
      POST: () => router.post(path, handler),
      PUT: () => router.put(path, handler),
      DELETE: () => router.delete(path, handler),
      PATCH: () => router.patch(path, handler),
      OPTIONS: () => router.options(path, handler),
      HEAD: () => router.head(path, handler),
    }

    const methodHandler = methods[method]
    if (!methodHandler) {
      throw new Error(`Unsupported method: ${method}`)
    }

    methodHandler()
  }

  const removeRoute = (step: Step<ApiRouteConfig>) => {
    const { path, method } = step.config
    const routerStack = router.stack

    /* biome-ignore lint/suspicious/noExplicitAny: migration */
    const filteredStack = routerStack.filter((layer: any) => {
      if (layer.route) {
        const match = layer.route.path === path && layer.route.methods[method.toLowerCase()]
        return !match
      }
      return true
    })
    router.stack = filteredStack
  }

  allSteps.filter(isApiStep).forEach(addRoute)

  app.use(cors())
  app.use(router)

  apiEndpoints(lockedData)
  flowsEndpoint(lockedData)
  flowsConfigEndpoint(app, process.cwd(), lockedData)
  analyticsEndpoint(app, process.cwd())
  stepEndpoint(app, lockedData)

  server.on('error', (error) => {
    console.error('Server error:', error)
  })

  const close = async (): Promise<void> => {
    cronManager.close()
    socketServer.close()
  }

  return {
    app,
    server,
    socketServer,
    close,
    removeRoute,
    addRoute,
    cronManager,
    motiaEventManager,
  }
}
