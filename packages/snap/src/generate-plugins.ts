import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {
  type ApiResponse,
  type ApiRouteConfig,
  type ApiRouteHandler,
  type Config,
  getStepConfig,
  type MotiaPlugin,
  type MotiaPluginContext,
  type MotiaServer,
  PLUGIN_FLOW_ID,
  type PluginApiConfig,
  type PluginStep,
  type Printer,
  type UnregisterMotiaPluginApi,
} from '@motiadev/core'
import { globSync } from 'glob'

const collectPluginSteps = async (
  dirname: string,
  stepPatterns: string[],
  projectRoot: string,
  printer: Printer,
): Promise<Array<{ filePath: string; config: any }>> => {
  const pluginSteps: Array<{ filePath: string; config: any }> = []

  if (!fs.existsSync(dirname)) {
    printer.printPluginWarn(`Directory not found: ${dirname}`)
    return pluginSteps
  }

  for (const pattern of stepPatterns) {
    try {
      const stepFiles = globSync(pattern, { absolute: true, cwd: dirname })

      if (stepFiles.length === 0) {
        printer.printPluginLog(`No files found matching pattern: ${pattern} in ${dirname}`)
        continue
      }

      for (const filePath of stepFiles) {
        try {
          const config = await getStepConfig(filePath, projectRoot)
          if (config) {
            pluginSteps.push({ filePath, config })
          } else {
            printer.printPluginWarn(`No config found in step ${filePath}, step skipped`)
          }
        } catch (error) {
          printer.printPluginError(`Error loading step ${filePath}:`, error)
        }
      }
    } catch (error) {
      printer.printPluginError(`Error processing pattern ${pattern}:`, error)
    }
  }

  return pluginSteps
}

const loadConfig = async (baseDir: string, printer: Printer): Promise<Config> => {
  const configFiles = globSync('motia.config.{ts,js}', { absolute: true, cwd: baseDir })
  if (configFiles.length === 0) {
    const templatePath = path.join(__dirname, 'create/templates/nodejs/motia.config.ts.txt')
    const templateContent = fs.readFileSync(templatePath, 'utf-8')
    const configPath = path.join(baseDir, 'motia.config.ts')
    fs.writeFileSync(configPath, templateContent)
    printer.printPluginLog('Created motia.config.ts')

    return (await import(configPath)).default
  }

  return (await import(configFiles[0])).default
}

const createPluginContext = (motiaServer: MotiaServer): MotiaPluginContext => {
  const { motia, addRoute, removeRoute, printer } = motiaServer
  return {
    printer,
    tracerFactory: motia.tracerFactory,
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
}

const processSteps = async (motiaServer: MotiaServer, plugins: MotiaPlugin[], baseDir: string): Promise<void> => {
  const { motia, addRoute, printer } = motiaServer
  for (const plugin of plugins) {
    if (plugin.dirname && plugin.steps) {
      printer.printPluginLog(`Loading steps from ${plugin.dirname}`)
      try {
        const pluginSteps = await collectPluginSteps(plugin.dirname, plugin.steps, baseDir, printer)
        const version = `plugin_${randomUUID()}:${Math.floor(Date.now() / 1000)}`

        for (const { filePath, config } of pluginSteps) {
          try {
            const isCreated = motia.lockedData.createStep(
              { filePath, version, config: { ...config, flows: [PLUGIN_FLOW_ID] } },
              { disableTypeCreation: true },
            )

            if (isCreated) {
              const step = motia.lockedData.activeSteps.find((s) => s.filePath === filePath)
              if (step && step.config.type === 'api') {
                addRoute(step as any)
              }
            } else {
              printer.printPluginWarn(`Failed to register step: ${config.name} from ${filePath}`)
            }
          } catch (error) {
            printer.printPluginError(`Error registering step ${filePath}:`, error)
          }
        }
      } catch (error) {
        printer.printPluginError(`Error loading steps from ${plugin.dirname}:`, error)
      }
    }
  }
}

export const processPlugins = async (motiaServer: MotiaServer): Promise<MotiaPlugin[]> => {
  const { printer, motia } = motiaServer
  const baseDir = motia.lockedData.baseDir

  const context: MotiaPluginContext = createPluginContext(motiaServer)

  const appConfig: Config = await loadConfig(baseDir, printer)

  if (!appConfig?.plugins) {
    printer.printPluginError('No plugins found in motia.config.ts')
    return []
  }

  const plugins: MotiaPlugin[] = appConfig.plugins?.flatMap((item) => item(context)) || []

  await processSteps(motiaServer, plugins, baseDir)

  return plugins
}
