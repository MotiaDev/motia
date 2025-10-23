import type { ResolvedPackage, WorkbenchPlugin } from './types'
import { isLocalPlugin, normalizePath, resolveLocalPath, resolveNpmPath } from './utils'

/**
 * Resolves a plugin package to its absolute path and creates an alias.
 *
 * @param plugin - The plugin configuration to resolve
 * @returns Resolved package information including path and alias
 *
 * @example
 * ```ts
 * // Local plugin
 * resolvePluginPackage({ packageName: '~/plugins/my-plugin' })
 * // Returns: {
 * //   packageName: '~/plugins/my-plugin',
 * //   resolvedPath: '/Users/project/plugins/my-plugin',
 * //   isLocal: true,
 * //   alias: '~/plugins/my-plugin'
 * // }
 *
 * // NPM package
 * resolvePluginPackage({ packageName: '@org/plugin' })
 * // Returns: {
 * //   packageName: '@org/plugin',
 * //   resolvedPath: '/Users/project/node_modules/@org/plugin',
 * //   isLocal: false,
 * //   alias: '@org/plugin'
 * // }
 * ```
 */
export function resolvePluginPackage(plugin: WorkbenchPlugin): ResolvedPackage {
  const { packageName } = plugin
  const local = isLocalPlugin(packageName)

  const resolvedPath = local ? resolveLocalPath(packageName) : resolveNpmPath(packageName)

  return {
    packageName,
    resolvedPath: normalizePath(resolvedPath),
    isLocal: local,
    alias: packageName,
  }
}

/**
 * Resolves all plugin packages and creates a Vite alias configuration.
 *
 * @param plugins - Array of plugin configurations
 * @returns Vite alias configuration object
 *
 * @example
 * ```ts
 * const plugins = [
 *   { packageName: '~/plugins/local' },
 *   { packageName: '@org/npm-plugin' }
 * ]
 * const aliases = createAliasConfig(plugins)
 * // Returns: {
 * //   '~/plugins/local': '/Users/project/plugins/local',
 * //   '@org/npm-plugin': '/Users/project/node_modules/@org/npm-plugin'
 * // }
 * ```
 */
export function createAliasConfig(plugins: WorkbenchPlugin[]): Record<string, string> {
  // Get unique package names to avoid duplicate aliases
  const uniquePackages = Array.from(new Set(plugins.map((p) => p.packageName)))

  const aliases: Record<string, string> = {}

  for (const packageName of uniquePackages) {
    const resolved = resolvePluginPackage({ packageName } as WorkbenchPlugin)
    aliases[packageName] = resolved.resolvedPath
  }

  return aliases
}

/**
 * Resolves all plugins and returns their resolved package information.
 *
 * @param plugins - Array of plugin configurations
 * @returns Array of resolved package information
 */
export function resolveAllPlugins(plugins: WorkbenchPlugin[]): ResolvedPackage[] {
  return plugins.map((plugin) => resolvePluginPackage(plugin))
}

/**
 * Gets the unique set of package names from plugins.
 *
 * @param plugins - Array of plugin configurations
 * @returns Array of unique package names
 */
export function getUniquePackageNames(plugins: WorkbenchPlugin[]): string[] {
  return Array.from(new Set(plugins.map((p) => p.packageName)))
}
