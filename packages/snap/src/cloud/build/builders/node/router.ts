import type { ApiRequest, ApiRouteConfig, ApiRouteHandler, FlowContext } from '@motiadev/core'
import express, { type Express, type Request, type Response } from 'express'
// {{imports}}

const createApiStepHandler = (handler: ApiRouteHandler, config: ApiRouteConfig) => {
  return async <TData>(req: ApiRequest, ctx: FlowContext<TData>) => {
    if (!config.middleware || config.middleware.length === 0) {
      return handler(req, ctx)
    }

    const composedHandler = config.middleware.reduceRight(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (nextHandler: () => Promise<any>, middleware) => () => middleware(req, ctx, nextHandler),
      () => handler(req, ctx),
    )

    return composedHandler()
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const router = (handler: ApiRouteHandler, config: ApiRouteConfig, context: FlowContext) => {
  return async (req: Request, res: Response) => {
    const data: ApiRequest = {
      body: req.body,
      headers: req.headers as Record<string, string | string[]>,
      pathParams: req.params,
      queryParams: req.query as Record<string, string | string[]>,
    }

    try {
      const middlewareHandler = createApiStepHandler(handler, config)
      const result = await middlewareHandler(data, context)

      if (result) {
        if (result.headers) {
          Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value))
        }

        res.status(result.status)
        res.json(result.body)
      } else {
        res.status(200).json({})
      }
    } catch (error) {
      context.logger.error('Internal server error', { error })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// We're using in the generated code, so we need to keep it
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createContext = (context: FlowContext, stepName: string): FlowContext => {
  return { ...context, logger: context.logger.child({ step: stepName }) }
}

// We're using in the generated code, so we need to keep it
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setupRouter(context: FlowContext): Express {
  const app = express()

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Generated code should look like this
  // app.get('/', (req, res) => router(handler, config, createContext(context, 'StepName'))(req, res))

  // {{routes}}

  app.use((_, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  return app
}
