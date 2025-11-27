/* eslint-disable @typescript-eslint/no-explicit-any */
export const composeMiddleware = (...middlewares: any[]) => {
  return async (req: any, ctx: any, handler: () => Promise<any>): Promise<any> => {
    const composedHandler = middlewares.reduceRight<() => Promise<any>>(
      (nextHandler, middleware) => () => middleware(req, ctx, nextHandler),
      handler,
    )

    return composedHandler()
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
