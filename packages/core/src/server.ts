import { CronManager, setupCronHandlers } from './cron-handler'
import bodyParser from 'body-parser'
import express, { Express, Request, Response } from 'express'
import http from 'http'
import multer from 'multer'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import { flowsEndpoint } from './flows-endpoint'
import { isApiStep } from './guards'
import { globalLogger } from './logger'
import { StateAdapter } from './state/state-adapter'
import {
  ApiRequest,
  ApiResponse,
  ApiRouteConfig,
  ApiRouteMethod,
  EventManager,
  InternalStateManager,
  IStateStream,
  Step,
} from './types'
import { systemSteps } from './steps'
import { LockedData } from './locked-data'
import { callStepFile } from './call-step-file'
import { LoggerFactory } from './LoggerFactory'
import { generateTraceId } from './generate-trace-id'
import { flowsConfigEndpoint } from './flows-config-endpoint'
import { apiEndpoints } from './api-endpoints'

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
  const upload = multer()

  const allSteps = [...systemSteps, ...lockedData.activeSteps]
  const cronManager = setupCronHandlers(lockedData, eventManager, state, loggerFactory)

  const streams = (lockedData as any).streams

  Object.keys(streams).forEach((streamName) => {
    const stream = streams[streamName]

    streams[streamName] = (state: InternalStateManager): IStateStream<any> => {
      const originalStream = stream(state)
      const wrapObject = (id: string, object: any) => ({
        ...object,
        __motia: { type: 'state-stream', streamName, id },
      })
      const updateState = (id: string, data: any) => {
        const result = wrapObject(id, data)
        io.to(`${streamName}-${id}`).emit(`${streamName}-${id}`, { type: 'update', data: result })
        return result
      }

      const deleteState = (id: string) => {
        io.to(`${streamName}-${id}`).emit(`${streamName}-${id}`, { type: 'delete', id })
        return originalStream.delete(id)
      }

      return {
        get: (id: string) => originalStream.get(id).then((object: any) => wrapObject(id, object)),
        update: (id: string, data: any) =>
          originalStream.update(id, data).then((object: any) => updateState(id, object)),
        delete: (id: string) => deleteState(id),
        create: (id: string, data: any) =>
          originalStream.create(id, data).then((object: any) => updateState(id, object)),
        getGroupId: () => originalStream.getGroupId(),
        getList: () => {
          const list = originalStream.getList()
          return list.map((id: string) => originalStream.get(id).then((object: any) => wrapObject(id, object)))
        },
      }
    }
  })

  io.on('connection', (socket) => {
    socket.on('join', async ({ id, streamName }: { streamName: string; id: string }) => {
      socket.join(`${streamName}-${id}`)

      const item = streams[streamName]

      if (item) {
        const object = await item(state).get(id)
        socket.emit('update', object)
      }
    })

    socket.on('leave', ({ id, streamName }: { streamName: string; id: string }) => {
      socket.leave(`${streamName}-${id}`)
    })
  })

  const asyncHandler = (step: Step<ApiRouteConfig>) => {
    return async (req: Request, res: Response) => {
      const traceId = generateTraceId()
      const { name: stepName, flows } = step.config
      const logger = loggerFactory.create({ traceId, flows, stepName })

      logger.debug('[API] Received request, processing step', { path: req.path })

      const request: ApiRequest = {
        body: req.body,
        headers: req.headers as Record<string, string | string[]>,
        pathParams: req.params,
        queryParams: req.query as Record<string, string | string[]>,
        files: req.files,
      }

      try {
        const data = request
        const result = await callStepFile<ApiResponse>({
          streamsConfig: lockedData.getStreams(),
          contextInFirstArg: false,
          data,
          step,
          printer,
          logger,
          eventManager,
          state,
          traceId,
        })

        if (!result) {
          res.status(500).json({ error: 'Internal server error' })
          return
        }

        if (result.headers) {
          Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value))
        }

        res.status(result.status)
        res.json(result.body)
      } catch (error) {
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
      POST: () => router.post(path, upload.any(), handler),
      PUT: () => router.put(path, upload.any(), handler),
      DELETE: () => router.delete(path, handler),
      PATCH: () => router.patch(path, upload.any(), handler),
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

  app.use(cors())
  app.use(router)

  apiEndpoints(lockedData, app, io)
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
