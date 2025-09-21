import bodyParser from 'body-parser'
import cors from 'cors'
import express, { Express, Request, Response } from 'express'
import http from 'http'
import { Server as WsServer } from 'ws'
import { analyticsEndpoint } from './analytics-endpoint'
import { trackEvent } from './analytics/utils'
import { callStepFile } from './call-step-file'
import { CronManager, setupCronHandlers } from './cron-handler'
import { flowsConfigEndpoint } from './flows-config-endpoint'
import { flowsEndpoint } from './flows-endpoint'
import { generateTraceId } from './generate-trace-id'
import { hasApiTrigger, getTriggersByType } from './guards'
import { LockedData } from './locked-data'
import { BaseLoggerFactory } from './logger-factory'
import { Motia } from './motia'
import { createTracerFactory } from './observability/tracer'
import { createSocketServer } from './socket-server'
import { createStepHandlers, MotiaEventManager } from './step-handlers'
import { createStateHandlers, MotiaStateManager } from './state-trigger-handler'
import { StateWrapper } from './state-wrapper'
import { systemSteps } from './steps'
import { apiEndpoints } from './streams/api-endpoints'
import { Log, LogsStream } from './streams/logs-stream'
import {
  ApiRequest,
  ApiResponse,
  ApiRouteMethod,
  EventManager,
  InternalStateManager,
  Step,
  ApiTrigger,
} from './types'
import { BaseStreamItem, MotiaStream, StateStreamEvent, StateStreamEventChannel } from './types-stream'
import { globalLogger } from './logger'
import { Printer } from './printer'
import { stepEndpoint } from './step-endpoint'

export type MotiaServer = {
  app: Express
  server: http.Server
  socketServer: WsServer
  close: () => Promise<void>
  removeRoute: (step: Step) => void
  addRoute: (step: Step) => void
  cronManager: CronManager
  motiaEventManager: MotiaEventManager
  motiaStateManager: MotiaStateManager
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return result.map(({ __motia, ...rest }) => rest)
      }
    },
  })

  lockedData.applyStreamWrapper((streamName, stream) => {
    return (): MotiaStream<BaseStreamItem> => {
      const main = stream() as MotiaStream<BaseStreamItem>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  
  // Wrap state with StateWrapper to enable state triggers
  const stateWrapper = new StateWrapper(state)
  const motia: Motia = { loggerFactory, eventManager, state: stateWrapper, lockedData, printer, tracerFactory }

  const cronManager = setupCronHandlers(motia)
  const motiaEventManager = createStepHandlers(motia)
  const motiaStateManager = createStateHandlers(motia)
  
  // Connect state wrapper to state trigger handler
  stateWrapper.setStateChangeCallback(motiaStateManager.checkStateTriggers)

  const asyncHandler = (step: Step, apiTrigger: ApiTrigger) => {
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

  app.use(bodyParser.json({ limit: '1gb' }))
  app.use(bodyParser.urlencoded({ extended: true, limit: '1gb' }))

  const router = express.Router()

  const addRoute = (step: Step) => {
    if (!hasApiTrigger(step)) {
      return // No API triggers, nothing to do
    }

    const apiTriggers = getTriggersByType(step, 'api')
    
    apiTriggers.forEach((apiTrigger: ApiTrigger) => {
      const { method, path } = apiTrigger
      globalLogger.debug('[API] Registering route', { step: step.config.name, method, path })

      const handler = asyncHandler(step, apiTrigger)
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
    })
  }

  const removeRoute = (step: Step) => {
    if (!hasApiTrigger(step)) {
      return // No API triggers, nothing to do
    }

    const apiTriggers = getTriggersByType(step, 'api')
    
    apiTriggers.forEach((apiTrigger: ApiTrigger) => {
      const { path, method } = apiTrigger
      const routerStack = router.stack

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filteredStack = routerStack.filter((layer: any) => {
        if (layer.route) {
          const match = layer.route.path === path && layer.route.methods[method.toLowerCase()]
          return !match
        }
        return true
      })
      router.stack = filteredStack
    })
  }

  allSteps.filter(hasApiTrigger).forEach(addRoute)

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

  return { app, server, socketServer, close, removeRoute, addRoute, cronManager, motiaEventManager, motiaStateManager }
}
