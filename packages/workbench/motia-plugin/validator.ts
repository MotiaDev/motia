import { existsSync } from 'fs'
import { z } from 'zod'
import type { ValidationResult, WorkbenchPlugin } from './types'
import { CONSTANTS, isValidPosition } from './types'
import { isLocalPlugin, resolveLocalPath } from './utils'

/**
 * Zod schema for WorkbenchPlugin configuration.
 * Provides runtime type validation with detailed error messages.
 */
const WorkbenchPluginSchema = z.object({
  packageName: z
    .string()
    .min(1, 'packageName is required and cannot be empty')
    .refine((name) => name.startsWith('~/') || name.startsWith('@') || /^[a-z0-9-_]+$/i.test(name), {
      message: 'packageName must be a valid npm package name or local path (starting with ~/)',
    }),

  componentName: z.string().optional(),

  position: z
    .enum(['top', 'bottom'])
    .optional()
    .refine((pos) => pos === undefined || isValidPosition(pos), {
      message: 'position must be either "top" or "bottom"',
    }),

  label: z.string().optional(),

  labelIcon: z.string().optional(),

  cssImports: z.array(z.string()).optional(),

  props: z.record(z.any(), z.any()).optional(),
})

/**
 * Validates a single plugin configuration.
 *
 * @param plugin - The plugin configuration to validate
 * @param index - The index of the plugin in the array (for error messages)
 * @returns A validation result with errors, warnings, and normalized plugin
 */
export function validatePluginConfig(plugin: any, index: number): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (typeof plugin !== 'object' || plugin === null) {
    return {
      valid: false,
      errors: [`Plugin at index ${index}: expected object, got ${typeof plugin}`],
      warnings: [],
    }
  }

  try {
    const result = WorkbenchPluginSchema.safeParse(plugin)

    if (!result.success) {
      result.error.issues.forEach((err: z.core.$ZodIssue) => {
        const path = err.path.join('.')
        errors.push(`Plugin at index ${index}, field "${path}": ${err.message}`)
      })

      return { valid: false, errors, warnings }
    }

    const validatedPlugin = result.data as WorkbenchPlugin

    if (isLocalPlugin(validatedPlugin.packageName)) {
      const resolvedPath = resolveLocalPath(validatedPlugin.packageName)
      if (!existsSync(resolvedPath)) {
        warnings.push(
          `Plugin at index ${index}: local path "${validatedPlugin.packageName}" does not exist at "${resolvedPath}". ` +
            `Make sure the path is correct relative to the project root.`,
        )
      }
    }

    if (!validatedPlugin.label) {
      warnings.push(`Plugin at index ${index}: "label" not specified, will use default "${CONSTANTS.DEFAULTS.LABEL}"`)
    }

    if (!validatedPlugin.labelIcon) {
      warnings.push(
        `Plugin at index ${index}: "labelIcon" not specified, will use default "${CONSTANTS.DEFAULTS.ICON}"`,
      )
    }

    if (!validatedPlugin.position) {
      warnings.push(
        `Plugin at index ${index}: "position" not specified, will use default "${CONSTANTS.DEFAULTS.POSITION}"`,
      )
    }

    if (validatedPlugin.props && Object.keys(validatedPlugin.props).length === 0) {
      warnings.push(`Plugin at index ${index}: "props" is an empty object`)
    }

    if (validatedPlugin.cssImports) {
      if (validatedPlugin.cssImports.length === 0) {
        warnings.push(`Plugin at index ${index}: "cssImports" is an empty array`)
      }

      validatedPlugin.cssImports.forEach((cssImport, cssIndex) => {
        if (!cssImport || cssImport.trim() === '') {
          warnings.push(`Plugin at index ${index}: cssImport at index ${cssIndex} is empty or whitespace`)
        }
      })
    }

    return {
      valid: true,
      errors: [],
      warnings,
      plugin: validatedPlugin,
    }
  } catch (error) {
    return {
      valid: false,
      errors: [`Plugin at index ${index}: unexpected validation error: ${error}`],
      warnings: [],
    }
  }
}

/**
 * Validates an array of plugin configurations.
 *
 * @param plugins - Array of plugin configurations to validate
 * @param options - Validation options
 * @returns Combined validation result for all plugins
 */
export function validatePlugins(plugins: any[], options: { failFast?: boolean } = {}): ValidationResult {
  const allErrors: string[] = []
  const allWarnings: string[] = []
  const validatedPlugins: WorkbenchPlugin[] = []

  if (!Array.isArray(plugins)) {
    return {
      valid: false,
      errors: [`Expected plugins to be an array, got ${typeof plugins}`],
      warnings: [],
    }
  }

  if (plugins.length === 0) {
    console.warn('[motia-plugins] No plugins provided to validate')
    return {
      valid: true,
      errors: [],
      warnings: ['No plugins configured'],
    }
  }

  for (let i = 0; i < plugins.length; i++) {
    const result = validatePluginConfig(plugins[i], i)

    allErrors.push(...result.errors)
    allWarnings.push(...result.warnings)

    if (result.valid && result.plugin) {
      validatedPlugins.push(result.plugin)
    }

    if (options.failFast && result.errors.length > 0) {
      break
    }
  }

  const packageNames = validatedPlugins.map((p) => p.packageName)
  const duplicates = packageNames.filter((name, index) => packageNames.indexOf(name) !== index)

  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)]
    uniqueDuplicates.forEach((dup) => {
      allWarnings.push(`Duplicate package name found: "${dup}". This may cause conflicts.`)
    })
  }

  const valid = allErrors.length === 0

  if (valid) {
    console.log(`[motia-plugins] ✓ Validated ${validatedPlugins.length} plugin(s) successfully`)
    if (allWarnings.length > 0) {
      console.warn(`[motia-plugins] Found ${allWarnings.length} warning(s)`)
    }
  } else {
    console.error(`[motia-plugins] ✗ Validation failed with ${allErrors.length} error(s)`)
  }

  return {
    valid,
    errors: allErrors,
    warnings: allWarnings,
  }
}
