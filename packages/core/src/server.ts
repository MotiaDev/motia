import bodyParser from 'body-parser'
import { randomUUID } from 'crypto'
import express, { Request, Response } from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import {
  ApiRequest,
  ApiRouteHandler,
  EmitData,
  EventManager,
  LockedData,
  Step,
  MotiaServer,
  MotiaSocketServer,
  InternalStateManager,
} from './types'
import { flowsEndpoint } from './flows-endpoint'
import { isApiStep } from './guards'
import { globalLogger, Logger } from './logger'
import { declareInternalStateManagerEndpoints } from './state/internalStateManagerEndpoints'
import { loadNodeFileExports } from './node/load-node-file-exports'
import { getModuleExport } from './node/get-module-export'

type ServerOptions = {
  steps: Step[]
  flows: LockedData['flows']
  eventManager: EventManager
  disableUi?: boolean
  state: InternalStateManager
  rootDir: string
}

export const createServer = async (
  options: ServerOptions,
): Promise<{ server: MotiaServer; socketServer: MotiaSocketServer }> => {
  const { flows, steps, eventManager, state } = options
  const app = express()
  const server = http.createServer(app)
  const io = new SocketIOServer(server)

  const asyncHandler = (step: Step, flows: string[]) => {
    return async (req: Request, res: Response) => {
      const traceId = randomUUID()
      const logger = new Logger(traceId, flows, step.config.name, io)

      logger.debug('[API] Received request, processing step', { path: req.path, step })

      const handler = (await getModuleExport(step.filePath, 'handler')) as ApiRouteHandler;
      const request: ApiRequest = {
        body: req.body,
        headers: req.headers as Record<string, string | string[]>,
        pathParams: req.params,
        queryParams: req.query as Record<string, string | string[]>,
      }
      const emit = async (event: EmitData) => {
        await eventManager.emit(
          {
            data: event.data,
            type: event.type,
            traceId,
            flows,
            logger,
          },
          step.filePath,
        )
      }

      try {
        const result = await handler(request, { emit, state, logger, traceId })

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

  const apiSteps = steps.filter(isApiStep)

  for (const step of apiSteps) {
    const { method, flows, path } = step.config

    globalLogger.debug('[API] Registering route', step.config)

    if (method === 'POST') {
      app.post(path, asyncHandler(step, flows))
    } else if (method === 'GET') {
      app.get(path, asyncHandler(step, flows))
    } else {
      throw new Error(`Unsupported method: ${method}`)
    }
  }

  flowsEndpoint(flows, app)

  declareInternalStateManagerEndpoints({ app, rootDir: options.rootDir })

  if (!options.disableUi) {
    const { applyMiddleware } = require('@motia/workbench/middleware')
    await applyMiddleware(app)
  }

  server.on('error', (error) => {
    console.error('Server error:', error)
  })

  return { server, socketServer: io }
}
