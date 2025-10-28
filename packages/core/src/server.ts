import bodyParser from 'body-parser'
import express, { type Express, type Request, type Response } from 'express'
import http from 'http'
import type { Server as WsServer } from 'ws'
import type { CronAdapter } from './adapters/interfaces/cron-adapter.interface'
import type { EventAdapter } from './adapters/interfaces/event-adapter.interface'
import type { StateAdapter } from './adapters/interfaces/state-adapter.interface'
import type { StreamAdapter } from './adapters/interfaces/stream-adapter.interface'
import { trackEvent } from './analytics/utils'
import { callStepFile } from './call-step-file'
import { type CronManager, setupCronHandlers } from './cron-handler'
import { analyticsEndpoint } from './endpoints/analytics-endpoint'
import { flowsConfigEndpoint } from './endpoints/flows-config-endpoint'
import { flowsEndpoint } from './endpoints/flows-endpoint'
import { stepEndpoint } from './endpoints/step-endpoint'
import { generateTraceId } from './generate-trace-id'
import { isApiStep } from './guards'
import type { LockedData } from './locked-data'
import { globalLogger } from './logger'
import { BaseLoggerFactory } from './logger-factory'
import type { Motia } from './motia'
import { createTracerFactory } from './observability/tracer'
import { Printer } from './printer'
import { createSocketServer } from './socket-server'
import { createStepHandlers, type MotiaEventManager } from './step-handlers'
import { systemSteps } from './steps'
import { type Log, LogsStream } from './streams/logs-stream'
import type { ApiRequest, ApiResponse, ApiRouteConfig, ApiRouteMethod, EmitData, Step } from './types'
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
  motia: Motia
}

type MotiaServerConfig = {
  isVerbose: boolean
  printer?: Printer
}

type AdapterOptions = {
  eventAdapter: EventAdapter
  cronAdapter?: CronAdapter
  streamAdapterFactory?: () => StreamAdapter<any>
}

export const createServer = (
  lockedData: LockedData,
  state: StateAdapter,
  config: MotiaServerConfig,
  adapters: AdapterOptions,
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

        return result.map(({ __motia, ...rest }) => rest)
      }
    },
  })

  lockedData.applyStreamWrapper((streamName, stream) => {
    return (): MotiaStream<BaseStreamItem> => {
      const main = stream() as MotiaStream<BaseStreamItem>

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

        pushEvent({ streamName, groupId, id, event: { type: 'delete', data: result } })

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
    eventAdapter: adapters.eventAdapter,
    state,
    lockedData,
    printer,
    tracerFactory,
    app,
    stateAdapter: state,
  }

  const cronManager = setupCronHandlers(motia, adapters?.cronAdapter)
  const motiaEventManager = createStepHandlers(motia, adapters.eventAdapter)

  const asyncHandler = (step: Step<ApiRouteConfig>) => {
    return async (req: Request, res: Response) => {
      const traceId = generateTraceId()
      const { name: stepName, flows } = step.config
      const logger = loggerFactory.create({ traceId, flows, stepName })
      const tracer = await motia.tracerFactory.createTracer(traceId, step, logger)

      logger.debug('[API] Received request, processing step', { path: req.path })

      const data: ApiRequest = {
        body: req.body,
        headers: req.headers as Record<string, string | string[]>,
        pathParams: req.params,
        queryParams: req.query as Record<string, string | string[]>,
      }

      try {
        let result: ApiResponse | undefined

        if ('handler' in step && typeof step.handler === 'function') {
          const context = {
            traceId,
            flows,
            state: state,
            emit: async (event: EmitData) => {
              const eventObj = {
                ...event,
                traceId,
                flows,
                logger,
                tracer,
              }
              await adapters.eventAdapter.emit(eventObj)
            },
            logger,
            streams: lockedData.getStreams(),
          }
          result = await step.handler(data, context)
          tracer.end()
        } else {
          result = await callStepFile<ApiResponse>({ data, step, logger, tracer, traceId }, motia)
        }

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

        // Handle different body types
        if (Buffer.isBuffer(result.body) || typeof result.body === 'string') {
          res.send(result.body)
        } else {
          res.json(result.body)
        }
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

  app.use(bodyParser.json({ limit: '1gb' }))
  app.use(bodyParser.urlencoded({ extended: true, limit: '1gb' }))

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

  app.options('*', (_req, res) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', '*')
    res.header('Access-Control-Allow-Headers', '*')
    res.header('Access-Control-Max-Age', '600')
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Allow-Private-Network', 'true')
    res.status(204).end()
  })
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', '*')
    res.header('Access-Control-Allow-Headers', '*')
    res.header('Access-Control-Max-Age', '600')
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Allow-Private-Network', 'true')
    next()
  })

  app.use(router)

  flowsEndpoint(lockedData)
  flowsConfigEndpoint(app, process.cwd(), lockedData)
  analyticsEndpoint(app, process.cwd())
  stepEndpoint(app, lockedData)

  server.on('error', (error) => {
    console.error('Server error:', error)
  })

  const close = async (): Promise<void> => {
    await cronManager.close()
    socketServer.close()
    if (adapters?.eventAdapter) {
      await adapters.eventAdapter.shutdown()
    }
  }

  return { app, server, socketServer, close, removeRoute, addRoute, cronManager, motiaEventManager, motia }
}
