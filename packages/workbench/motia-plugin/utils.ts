import path from 'path'

/**
 * Normalizes a file path by replacing backslashes with forward slashes.
 * This is useful for consistent path comparisons across different operating systems.
 *
 * @param filePath - The file path to normalize
 * @returns The normalized file path with forward slashes
 *
 * @example
 * ```ts
 * normalizePath('C:\\Users\\file.ts') // Returns: 'C:/Users/file.ts'
 * normalizePath('/Users/file.ts')     // Returns: '/Users/file.ts'
 * ```
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/')
}

/**
 * Checks if a package name represents a local plugin (starts with ~/).
 *
 * @param packageName - The package name to check
 * @returns True if the package is a local plugin
 *
 * @example
 * ```ts
 * isLocalPlugin('~/plugins/my-plugin')     // Returns: true
 * isLocalPlugin('@my-org/my-plugin')       // Returns: false
 * isLocalPlugin('my-plugin')               // Returns: false
 * ```
 */
export function isLocalPlugin(packageName: string): boolean {
  return packageName.startsWith('~/')
}

/**
 * Resolves a local plugin path to an absolute path.
 * Strips the ~/ prefix and joins with the current working directory.
 *
 * @param packageName - The local plugin package name (must start with ~/)
 * @returns The absolute path to the local plugin
 *
 * @example
 * ```ts
 * // If cwd is /Users/project
 * resolveLocalPath('~/plugins/my-plugin')
 * // Returns: '/Users/project/plugins/my-plugin'
 * ```
 */
export function resolveLocalPath(packageName: string): string {
  return path.join(process.cwd(), packageName.replace('~/', ''))
}

/**
 * Resolves an npm package path to the node_modules directory.
 *
 * @param packageName - The npm package name
 * @returns The absolute path to the package in node_modules
 *
 * @example
 * ```ts
 * // If cwd is /Users/project
 * resolveNpmPath('@my-org/my-plugin')
 * // Returns: '/Users/project/node_modules/@my-org/my-plugin'
 * ```
 */
export function resolveNpmPath(packageName: string): string {
  return path.join(process.cwd(), 'node_modules', packageName)
}
