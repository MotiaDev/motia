import { Printer } from '@motiadev/core'
import path from 'path'
import type { Plugin, ViteDevServer } from 'vite'
import { generateCssImports, generatePluginCode, isValidCode } from './generator'
import { handlePluginHotUpdate } from './hmr'
import { createAliasConfig, resolvePluginPackage } from './resolver'
import type { WorkbenchPlugin } from './types'
import { CONSTANTS } from './types'
import { isLocalPlugin, normalizePath } from './utils'
import { validatePlugins } from './validator'

/**
 * Vite plugin for loading and managing Motia workbench plugins.
 *
 * Features:
 * - Hot Module Replacement (HMR) support
 * - Runtime validation with detailed error messages
 * - Verbose logging for debugging
 * - CSS injection for plugin styles
 *
 * @param plugins - Array of plugin configurations
 * @param options - Optional loader configuration
 * @returns Vite plugin instance
 *
 * @example
 * ```ts
 * export default defineConfig({
 *   plugins: [
 *     motiaPluginsPlugin([
 *       { packageName: '@my-org/plugin', label: 'My Plugin' }
 *     ])
 *   ]
 * })
 * ```
 */
const printer = new Printer(process.cwd())

export default function motiaPluginsPlugin(plugins: WorkbenchPlugin[]): Plugin {
  let devServer: ViteDevServer | null = null

  try {
    const validationResult = validatePlugins(plugins, {
      failFast: false,
    })

    if (!validationResult.valid) {
      printer.printPluginError('Plugin configuration validation failed:')
      for (const err of validationResult.errors) {
        printer.printPluginError(`  ${err}`)
      }
      throw new Error('Invalid plugin configuration. See errors above.')
    }

    if (validationResult.warnings.length > 0) {
      for (const warning of validationResult.warnings) {
        printer.printPluginWarn(warning)
      }
    }
  } catch (error) {
    printer.printPluginError(`Failed to validate plugins: ${error}`)
    throw error
  }

  const alias = createAliasConfig(plugins)

  printer.printPluginLog(`Initialized with ${plugins.length} plugin(s)`)

  return {
    name: 'vite-plugin-motia-plugins',
    enforce: 'pre',

    buildStart() {
      printer.printPluginLog('Build started')
    },

    config: () => ({
      resolve: {
        alias,
      },
    }),

    configureServer(server) {
      devServer = server
      printer.printPluginLog('Dev server configured, HMR enabled')

      const configPaths = [path.join(process.cwd(), 'motia.config.ts'), path.join(process.cwd(), 'motia.config.js')]

      for (const configPath of configPaths) {
        server.watcher.add(configPath)
      }
      printer.printPluginLog('Watching for config file changes')

      const localPlugins = plugins.filter((p) => isLocalPlugin(p.packageName))
      if (localPlugins.length > 0) {
        printer.printPluginLog(`Watching ${localPlugins.length} local plugin(s)`)

        for (const plugin of localPlugins) {
          const resolved = resolvePluginPackage(plugin)
          const watchPath = resolved.resolvedPath

          server.watcher.add(watchPath)
          printer.printPluginLog(`Watching: ${watchPath}`)
        }

        server.watcher.on('change', (file) => {
          const normalizedFile = normalizePath(file)
          printer.printPluginLog(`File watcher detected change: ${normalizedFile}`)
        })

        server.watcher.on('add', (file) => {
          const normalizedFile = normalizePath(file)
          printer.printPluginLog(`File watcher detected new file: ${normalizedFile}`)
        })
      }
    },

    resolveId(id) {
      if (id === CONSTANTS.VIRTUAL_MODULE_ID) {
        return CONSTANTS.RESOLVED_VIRTUAL_MODULE_ID
      }
    },

    load(id) {
      if (id !== CONSTANTS.RESOLVED_VIRTUAL_MODULE_ID) {
        return null
      }

      printer.printPluginLog('Loading plugins virtual module')
      printer.printPluginLog('Generating plugin code...')

      const code = generatePluginCode(plugins)

      if (!isValidCode(code)) {
        printer.printPluginError('Generated code is invalid or empty')
        return 'export const plugins = []'
      }

      printer.printPluginLog('Plugin code generated successfully')

      return code
    },

    async transform(code, id) {
      const normalizedId = normalizePath(id)

      if (!normalizedId.endsWith('src/index.css')) {
        return null
      }

      printer.printPluginLog('Injecting plugin CSS imports')

      const cssImports = generateCssImports(plugins)

      if (!cssImports) {
        return null
      }

      return {
        code: `${cssImports}\n${code}`,
        map: null,
      }
    },

    handleHotUpdate(ctx) {
      if (!devServer) {
        printer.printPluginWarn('HMR: Dev server not available')
        return
      }

      const modulesToUpdate = handlePluginHotUpdate(ctx, plugins, printer)

      if (modulesToUpdate && modulesToUpdate.length > 0) {
        const merged = Array.from(new Set([...(ctx.modules || []), ...modulesToUpdate]))
        printer.printPluginLog(`HMR: Successfully updated ${merged.length} module(s)`)
        return merged
      }
    },

    buildEnd() {
      printer.printPluginLog('Build ended')
    },
  }
}
