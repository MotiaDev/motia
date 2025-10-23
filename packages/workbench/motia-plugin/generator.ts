import { getUniquePackageNames } from './resolver'
import type { WorkbenchPlugin } from './types'

/**
 * Generates import statements for all unique plugin packages.
 *
 * @param packages - Array of unique package names
 * @returns JavaScript code string with import statements
 *
 * @example
 * ```ts
 * generateImports(['@org/plugin-1', '~/plugins/local'])
 * // Returns:
 * // import * as plugin_0 from '@org/plugin-1'
 * // import * as plugin_1 from '~/plugins/local'
 * ```
 */
export function generateImports(packages: string[]): string {
  return packages.map((packageName, index) => `import * as plugin_${index} from '${packageName}'`).join('\n')
}

/**
 * Generates the package map that links package names to their imported modules.
 *
 * @param packages - Array of unique package names
 * @returns JavaScript code string defining the package map
 *
 * @example
 * ```ts
 * generatePackageMap(['@org/plugin-1', '~/plugins/local'])
 * // Returns: const packageMap = {'@org/plugin-1': plugin_0,'~/plugins/local': plugin_1}
 * ```
 */
export function generatePackageMap(packages: string[]): string {
  const entries = packages.map((packageName, index) => `'${packageName}': plugin_${index}`)
  return `const packageMap = {${entries.join(',')}}`
}

/**
 * Generates the plugin transformation logic that processes plugin configurations.
 *
 * @param plugins - Array of plugin configurations
 * @returns JavaScript code string with plugin processing logic
 */
export function generatePluginLogic(plugins: WorkbenchPlugin[]): string {
  return `
      const motiaPlugins = ${JSON.stringify(plugins)}

      export const plugins = motiaPlugins.map((plugin) => {
        const component = packageMap[plugin.packageName]
        const config = component.config || {}
        const componentName = config.componentName || plugin.componentName

        return {
          label: plugin.label || config.label || 'Plugin label',
          labelIcon: plugin.labelIcon || config.labelIcon || 'toy-brick',
          position: plugin.position || config.position || 'top',
          props: plugin.props || config.props || {},
          component: componentName ? component[componentName] : component.default,
        }
      })
`
}

/**
 * Generates the complete virtual module code for all plugins.
 * This is the main code generation function that combines all parts.
 *
 * @param plugins - Array of plugin configurations
 * @returns Complete JavaScript code string for the virtual module
 *
 * @example
 * ```ts
 * const plugins = [
 *   { packageName: '@test/plugin', label: 'Test' }
 * ]
 * const code = generatePluginCode(plugins)
 * // Returns complete module code with imports, map, and logic
 * ```
 */
export function generatePluginCode(plugins: WorkbenchPlugin[]): string {
  if (!plugins || plugins.length === 0) {
    return 'export const plugins = []'
  }

  const packages = getUniquePackageNames(plugins)
  const imports = generateImports(packages)
  const packageMap = generatePackageMap(packages)
  const logic = generatePluginLogic(plugins)

  return `${imports}
${packageMap}
${logic}`
}

/**
 * Generates CSS imports for plugins that specify cssImports.
 *
 * @param plugins - Array of plugin configurations
 * @returns CSS import statements as a string
 *
 * @example
 * ```ts
 * const plugins = [
 *   { packageName: '@test/plugin', cssImports: ['styles.css', 'theme.css'] }
 * ]
 * generateCssImports(plugins)
 * // Returns:
 * // @import 'styles.css';
 * // @import 'theme.css';
 * ```
 */
export function generateCssImports(plugins: WorkbenchPlugin[]): string {
  const cssImports = plugins
    .flatMap((plugin) => plugin.cssImports || [])
    .filter((cssImport) => cssImport && cssImport.trim() !== '')
    .map((cssImport) => `@import '${cssImport}';`)

  return cssImports.join('\n')
}

/**
 * Checks if the generated code is valid (non-empty and has content).
 *
 * @param code - The generated code to check
 * @returns True if code is valid
 */
export function isValidCode(code: string): boolean {
  return typeof code === 'string' && code.trim().length > 0
}
