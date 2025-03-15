import { ApiMiddleware, ApiRequest, ApiResponse, FlowContext } from './types'

export default (...middlewares: ApiMiddleware[]) => {
  return async (req: ApiRequest, ctx: FlowContext, handler: () => Promise<ApiResponse>): Promise<ApiResponse> => {
    const composedHandler = middlewares.reduceRight<() => Promise<ApiResponse>>(
      (nextHandler, middleware) => () => middleware(req, ctx, nextHandler),
      handler,
    )

    return composedHandler()
  }
}
