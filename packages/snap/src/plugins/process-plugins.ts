import type { Config, MotiaPlugin, MotiaPluginContext, MotiaServer } from '@motiadev/core'
import { createPluginContext } from './create-plugin-context'
import { loadConfig } from './load-config'
import { processSteps } from './process-steps'

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
