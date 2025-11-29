import type {
  ApiResponse,
  ApiRouteConfig,
  ApiRouteHandler,
  MotiaPluginContext,
  MotiaServer,
  PluginApiConfig,
  PluginStep,
  UnregisterMotiaPluginApi,
} from '@motiadev/core'

export const createPluginContext = (motiaServer: MotiaServer): MotiaPluginContext => {
  const { motia, addRoute, removeRoute, printer } = motiaServer
  return {
    printer,
    tracerFactory: motia.tracerFactory,
    state: motia.stateAdapter,
    lockedData: motia.lockedData,
    eventAdapter: motia.eventAdapter,
    registerApi: <
      TRequestBody = unknown,
      TResponseBody extends ApiResponse<number, unknown> = ApiResponse<number, unknown>,
      TEmitData = never,
    >(
      config: PluginApiConfig,
      handler: ApiRouteHandler<TRequestBody, TResponseBody, TEmitData>,
    ): UnregisterMotiaPluginApi => {
      const apiConfig: ApiRouteConfig = {
        type: 'api',
        name: `Plugin API: ${config.method} ${config.path}`,
        path: config.path,
        method: config.method,
        emits: [],
        flows: ['_plugin'],
      }

      const step: PluginStep<ApiRouteConfig> = {
        filePath: `__plugin_${Date.now()}_${config.method}_${config.path.replace(/\//g, '_')}.ts`,
        version: '1',
        config: apiConfig,
        handler,
      }
      addRoute(step)
      return () => {
        removeRoute(step)
      }
    },
  }
}
