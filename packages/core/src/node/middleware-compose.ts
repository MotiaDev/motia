/* biome-ignore lint/suspicious/noExplicitAny: migration */
export const composeMiddleware = (...middlewares: any[]) => {
  /* biome-ignore lint/suspicious/noExplicitAny: migration */
  return async (req: any, ctx: any, handler: () => Promise<any>): Promise<any> => {
    /* biome-ignore lint/suspicious/noExplicitAny: migration */
    const composedHandler = middlewares.reduceRight<() => Promise<any>>(
      (nextHandler, middleware) => () => middleware(req, ctx, nextHandler),
      handler,
    )

    return composedHandler()
  }
}
