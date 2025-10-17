import type {
  ApiResponse,
  ApiRouteConfig,
  ApiRouteHandler,
  Config,
  MotiaPlugin,
  MotiaPluginContext,
  MotiaServer,
  PluginApiConfig,
  PluginStep,
  UnregisterMotiaPluginApi,
} from '@motiadev/core'
import fs from 'fs'
import { globSync } from 'glob'
import path from 'path'

export const generatePlugins = async (motiaServer: MotiaServer): Promise<MotiaPlugin[]> => {
  const { motia, addRoute, removeRoute } = motiaServer
  const baseDir = motia.lockedData.baseDir
  let configFiles = globSync('motia.config.{ts,js}', { absolute: true, cwd: baseDir })

  if (configFiles.length === 0) {
    const templatePath = path.join(__dirname, 'create/templates/nodejs/motia.config.ts.txt')
    const templateContent = fs.readFileSync(templatePath, 'utf-8')
    const configPath = path.join(baseDir, 'motia.config.ts')
    fs.writeFileSync(configPath, templateContent)
    console.log('Created motia.config.ts with default plugins')

    configFiles = globSync('motia.config.{ts,js}', { absolute: true, cwd: baseDir })
  }

  const context: MotiaPluginContext = {
    state: motia.stateAdapter,
    lockedData: motia.lockedData,
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

  const appConfig: Config = (await import(configFiles[0])).default
  const plugins = appConfig.plugins?.flatMap((item) => item(context)) || []

  return plugins
}
