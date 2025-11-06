import { randomUUID } from 'node:crypto'
import { type MotiaPlugin, type MotiaServer, PLUGIN_FLOW_ID } from '@motiadev/core'
import { collectPluginSteps } from './collect-plugin-steps'

export const processSteps = async (
  motiaServer: MotiaServer,
  plugins: MotiaPlugin[],
  baseDir: string,
): Promise<void> => {
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
                // biome-ignore lint/suspicious/noExplicitAny: Step type casting needed for route handler
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
