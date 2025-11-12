import type { Printer } from '@motiadev/core'
import path from 'path'
import type { HmrContext, ModuleNode } from 'vite'
import { resolvePluginPackage } from './resolver'
import type { WorkbenchPlugin } from './types'
import { CONSTANTS } from './types'
import { isLocalPlugin, normalizePath } from './utils'

const WATCHED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.less']

export function isConfigFile(file: string): boolean {
  const normalizedFile = normalizePath(file)
  return normalizedFile.endsWith('motia.config.ts') || normalizedFile.endsWith('motia.config.js')
}

/**
 * Checks if a file change should trigger HMR for plugins.
 *
 * @param file - The file path that changed
 * @param plugins - Current plugin configurations
 * @returns True if the change affects plugins
 */
export function shouldInvalidatePlugins(file: string, plugins: WorkbenchPlugin[]): boolean {
  const normalizedFile = normalizePath(file)
  const absoluteFile = path.isAbsolute(normalizedFile) ? normalizedFile : path.resolve(process.cwd(), normalizedFile)

  if (isConfigFile(file)) {
    return true
  }

  const hasWatchedExtension = WATCHED_EXTENSIONS.some((ext) => absoluteFile.endsWith(ext))
  if (!hasWatchedExtension) {
    return false
  }

  for (const plugin of plugins) {
    if (isLocalPlugin(plugin.packageName)) {
      const resolved = resolvePluginPackage(plugin)
      const pluginAbsolutePath = path.isAbsolute(resolved.resolvedPath)
        ? resolved.resolvedPath
        : path.resolve(process.cwd(), resolved.resolvedPath)

      const normalizedPluginPath = pluginAbsolutePath.endsWith(path.sep)
        ? pluginAbsolutePath
        : `${pluginAbsolutePath}${path.sep}`

      if (absoluteFile.startsWith(normalizedPluginPath) || absoluteFile === pluginAbsolutePath) {
        return true
      }
    }
  }

  return false
}

/**
 * Handles hot updates for the plugin system.
 * This function is called by Vite's handleHotUpdate hook.
 *
 * @param ctx - Vite's HMR context
 * @param plugins - Current plugin configurations
 * @param printer - Printer instance for logging
 * @returns Array of modules to update, or undefined to continue with default behavior
 */
export function handlePluginHotUpdate(
  ctx: HmrContext,
  plugins: WorkbenchPlugin[],
  printer: Printer,
): ModuleNode[] | undefined {
  const { file, server, timestamp } = ctx

  printer.printPluginLog(`HMR: File changed: ${normalizePath(file)}`)

  if (isConfigFile(file)) {
    printer.printPluginLog('HMR: Config file changed, triggering full page reload')
    printer.printPluginWarn(
      'Configuration changes require a server restart for full effect. Please restart the dev server to apply all changes.',
    )
    server.ws.send({
      type: 'full-reload',
      path: '*',
    })
    return
  }

  if (!shouldInvalidatePlugins(file, plugins)) {
    printer.printPluginLog('HMR: Change outside plugin scope, delegating to Vite default handling')
    return
  }

  printer.printPluginLog('HMR: Plugin change detected, invalidating virtual module')

  const virtualModule = server.moduleGraph.getModuleById(CONSTANTS.RESOLVED_VIRTUAL_MODULE_ID)

  if (!virtualModule) {
    printer.printPluginWarn('HMR: Virtual module not found, triggering full reload as fallback')
    server.ws.send({
      type: 'full-reload',
      path: '*',
    })
    return
  }

  server.moduleGraph.invalidateModule(virtualModule, new Set(), timestamp)
  printer.printPluginLog('HMR: Virtual module invalidated')

  const modulesToUpdateSet = new Set<ModuleNode>([virtualModule])
  const processedModules = new Set<ModuleNode>([virtualModule])

  for (const importer of virtualModule.importers) {
    if (!processedModules.has(importer)) {
      processedModules.add(importer)
      modulesToUpdateSet.add(importer)
      server.moduleGraph.invalidateModule(importer, new Set(), timestamp)
    }
  }

  const modulesToUpdate = Array.from(modulesToUpdateSet)

  printer.printPluginLog(`HMR: Updated ${modulesToUpdate.length} module(s)`)

  return modulesToUpdate
}
