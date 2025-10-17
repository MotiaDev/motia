import type { HmrContext, ModuleNode } from 'vite'
import type { WorkbenchPlugin } from './types'
import { CONSTANTS } from './types'
import { normalizePath } from './utils'

/**
 * Checks if a file change should trigger HMR for plugins.
 *
 * @param file - The file path that changed
 * @param plugins - Current plugin configurations
 * @returns True if the change affects plugins
 */
export function shouldInvalidatePlugins(file: string, plugins: WorkbenchPlugin[]): boolean {
  const normalizedFile = normalizePath(file)

  // Check if the changed file is a local plugin
  for (const plugin of plugins) {
    if (plugin.packageName.startsWith('~/')) {
      const pluginPath = plugin.packageName.replace('~/', '')
      if (normalizedFile.includes(pluginPath)) {
        return true
      }
    }
  }

  // Check if it's a plugin configuration file
  if (normalizedFile.endsWith('motia.config.ts') || normalizedFile.endsWith('motia.config.js')) {
    return true
  }

  return false
}

/**
 * Handles hot updates for the plugin system.
 * This function is called by Vite's handleHotUpdate hook.
 *
 * @param ctx - Vite's HMR context
 * @param plugins - Current plugin configurations
 * @returns Array of modules to update, or undefined to continue with default behavior
 */
export function handlePluginHotUpdate(ctx: HmrContext, plugins: WorkbenchPlugin[]): ModuleNode[] | void {
  const { file, server } = ctx

  console.log('[motia-plugins] HMR: File changed:', file)

  // Check if this change affects plugins
  if (!shouldInvalidatePlugins(file, plugins)) {
    return // Let Vite handle it normally
  }

  console.log('[motia-plugins] HMR: Plugin configuration or local plugin changed, invalidating virtual module')

  // Find the virtual module
  const virtualModule = server.moduleGraph.getModuleById(CONSTANTS.RESOLVED_VIRTUAL_MODULE_ID)

  if (virtualModule) {
    // Invalidate the virtual module to force regeneration
    server.moduleGraph.invalidateModule(virtualModule)
    console.log('[motia-plugins] HMR: Virtual module invalidated')
  }

  // Return modules to update (includes the virtual module and any dependent modules)
  const modulesToUpdate: ModuleNode[] = []

  if (virtualModule) {
    modulesToUpdate.push(virtualModule)
  }

  // Add any modules that import the virtual module
  const importers = virtualModule?.importers || new Set()
  for (const importer of importers) {
    modulesToUpdate.push(importer)
    console.log('[motia-plugins] HMR: Invalidating importer:', importer.id)
  }

  return modulesToUpdate
}
