import { CronManager, setupCronHandlers } from './cron-handler'
import bodyParser from 'body-parser'
import express, { Express, Request, Response, RequestHandler } from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { flowsEndpoint } from './flows-endpoint'
import { isApiStep } from './guards'
import { globalLogger, Logger } from './logger'
import { StateAdapter } from './state/state-adapter'
import { ApiRequest, ApiResponse, ApiRouteConfig, ApiRouteMethod, EmitData, EventManager, Step } from './types'
import { systemSteps } from './steps'
import { LockedData } from './locked-data'
import { callStepFile } from './call-step-file'
import { LoggerFactory } from './LoggerFactory'
import { generateTraceId } from './generate-trace-id'
import { flowsConfigEndpoint } from './flows-config-endpoint'
import composeMiddleware from './middleware-composer'

export type MotiaServer = {
  app: Express
  server: http.Server
  socketServer: SocketIOServer
  close: () => Promise<void>
  removeRoute: (step: Step<ApiRouteConfig>) => void
  addRoute: (step: Step<ApiRouteConfig>) => void
  cronManager: CronManager
}

type MotiaServerConfig = {
  isVerbose: boolean
}

export const createServer = async (
  lockedData: LockedData,
  eventManager: EventManager,
  state: StateAdapter,
  config: MotiaServerConfig,
): Promise<MotiaServer> => {
  const printer = lockedData.printer
  const app = express()
  const server = http.createServer(app)
  const io = new SocketIOServer(server)
  const loggerFactory = new LoggerFactory(config.isVerbose, io)

  const allSteps = [...systemSteps, ...lockedData.activeSteps]
  const cronManager = setupCronHandlers(lockedData, eventManager, state, loggerFactory)

  const asyncHandler = (step: Step<ApiRouteConfig>): RequestHandler => {
    return async (req: Request, res: Response) => {
      const traceId = generateTraceId()
      const { name: stepName, flows } = step.config
      const logger = loggerFactory.create({ traceId, flows, stepName }) as Logger

      logger.debug('[API] Received request, processing step', { path: req.path })

      const request: ApiRequest = {
        body: req.body,
        headers: req.headers as Record<string, string | string[]>,
        pathParams: req.params,
        queryParams: req.query as Record<string, string | string[]>,
      }

      const ctx = {
        emit: async (event: EmitData) => {
          await eventManager.emit({
            topic: event.topic,
            data: event.data,
            traceId,
            logger,
          })
        },
        traceId,
        state,
        logger,
      }

      const finalHandler = async (): Promise<ApiResponse> => {
        try {
          const result = await callStepFile<ApiResponse>({
            contextInFirstArg: false,
            data: request,
            step,
            printer,
            logger,
            eventManager,
            state,
            traceId,
          })

          if (!result) {
            return { status: 500, body: { error: 'Internal server error' } }
          }

          return result
        } catch (error) {
          logger.error('[API] Internal server error', { error })
          console.log(error)
          return { status: 500, body: { error: 'Internal server error' } }
        }
      }

      try {
        const middleware = step.config.middleware || []

        const result = await composeMiddleware(...middleware)(request, ctx, finalHandler)

        if (result.headers) {
          Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value))
        }

        res.status(result.status)
        res.json(result.body)
      } catch (error) {
        logger.error('[API] Error in middleware chain', { error })
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

    const expressHandler = asyncHandler(step)

    const methods: Record<ApiRouteMethod, () => void> = {
      GET: () => router.get(path, expressHandler),
      POST: () => router.post(path, expressHandler),
      PUT: () => router.put(path, expressHandler),
      DELETE: () => router.delete(path, expressHandler),
      PATCH: () => router.patch(path, expressHandler),
      OPTIONS: () => router.options(path, expressHandler),
      HEAD: () => router.head(path, expressHandler),
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  app.use(router)

  flowsEndpoint(lockedData, app)
  flowsConfigEndpoint(app, process.cwd())

  server.on('error', (error) => {
    console.error('Server error:', error)
  })

  const close = async (): Promise<void> => {
    cronManager.close()
    await io.close()
    server.close()
  }

  return { app, server, socketServer: io, close, removeRoute, addRoute, cronManager }
}
