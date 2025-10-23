import type { Plugin } from 'vite'
import { generateCssImports, generatePluginCode, isValidCode } from './generator'
import { handlePluginHotUpdate } from './hmr'
import { createAliasConfig } from './resolver'
import type { WorkbenchPlugin } from './types'
import { CONSTANTS } from './types'
import { normalizePath } from './utils'
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
export default function motiaPluginsPlugin(plugins: WorkbenchPlugin[]): Plugin {
  let devServer: any = null

  try {
    const validationResult = validatePlugins(plugins, {
      failFast: false,
    })

    if (!validationResult.valid) {
      console.error('[motia-plugins] Plugin configuration validation failed:')
      validationResult.errors.forEach((err) => console.error(`[motia-plugins]   ${err}`))
      throw new Error('Invalid plugin configuration. See errors above.')
    }

    if (validationResult.warnings.length > 0) {
      validationResult.warnings.forEach((warning) => console.warn('[motia-plugins]', warning))
    }
  } catch (error) {
    console.error('[motia-plugins] Failed to validate plugins:', error)
    throw error
  }

  const alias = createAliasConfig(plugins)

  console.log(`[motia-plugins] Initialized with ${plugins.length} plugin(s)`)

  return {
    name: 'vite-plugin-motia-plugins',
    enforce: 'pre',

    buildStart() {
      console.log('[motia-plugins] Build started')
    },

    config: () => ({
      resolve: {
        alias,
      },
    }),

    configureServer(server) {
      devServer = server
      console.log('[motia-plugins] Dev server configured, HMR enabled')
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

      console.log('[motia-plugins] Loading plugins virtual module')
      console.log('[motia-plugins] Generating plugin code...')

      const code = generatePluginCode(plugins)

      if (!isValidCode(code)) {
        console.error('[motia-plugins] Generated code is invalid or empty')
        return 'export const plugins = []'
      }

      console.log('[motia-plugins] Plugin code generated successfully')

      return code
    },

    async transform(code, id) {
      const normalizedId = normalizePath(id)

      if (!normalizedId.endsWith('src/index.css')) {
        return null
      }

      console.log('[motia-plugins] Injecting plugin CSS imports')

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
        return
      }

      const modulesToUpdate = handlePluginHotUpdate(ctx, plugins)

      if (modulesToUpdate) {
        console.log('[motia-plugins] Hot reloaded plugins')
        return modulesToUpdate
      }
    },

    buildEnd() {
      console.log('[motia-plugins] Build ended')
    },
  }
}
