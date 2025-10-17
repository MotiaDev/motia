/**
 * Configuration for a single workbench plugin.
 * This interface defines how plugins are registered and configured in the Motia workbench.
 */
export interface WorkbenchPlugin {
  /**
   * The package name or local path to the plugin.
   * - For npm packages: use the package name (e.g., '@my-org/my-plugin')
   * - For local plugins: use the tilde prefix (e.g., '~/plugins/my-plugin')
   */
  packageName: string

  /**
   * Optional named export to use from the plugin package.
   * If not specified, the default export will be used.
   * Can be overridden by the plugin's own config.
   */
  componentName?: string

  /**
   * Position where the plugin tab should appear in the workbench.
   * - 'top': Display in the top tab bar
   * - 'bottom': Display in the bottom tab bar
   * @default 'top'
   */
  position?: 'top' | 'bottom'

  /**
   * Display label for the plugin tab.
   * Can be overridden by the plugin's own config.
   */
  label?: string

  /**
   * Icon name from lucide-react to display next to the label.
   * Can be overridden by the plugin's own config.
   * @default 'toy-brick'
   */
  labelIcon?: string

  /**
   * Array of CSS package imports to inject into the workbench.
   * These will be added to the main index.css file.
   * Example: ['@my-org/my-plugin/styles.css']
   */
  cssImports?: string[]

  /**
   * Props to pass to the plugin component when it's rendered.
   * Can be overridden by the plugin's own config.
   */
  props?: Record<string, any>
}

/**
 * Result of validating a plugin configuration.
 */
export interface ValidationResult {
  /**
   * Whether the validation passed
   */
  valid: boolean

  /**
   * Array of error messages if validation failed
   */
  errors: string[]

  /**
   * Array of warning messages for non-critical issues
   */
  warnings: string[]

  /**
   * The validated and normalized plugin configuration (if valid)
   */
  plugin?: WorkbenchPlugin
}

/**
 * Context object passed to various plugin internals functions.
 * Contains shared state and configuration.
 */
export interface PluginContext {
  /**
   * Array of plugin configurations
   */
  plugins: WorkbenchPlugin[]

  /**
   * Vite dev server instance (only available in dev mode)
   */
  server?: any
}

/**
 * Package resolution result.
 */
export interface ResolvedPackage {
  /**
   * The original package name from the configuration
   */
  packageName: string

  /**
   * Resolved absolute path to the package
   */
  resolvedPath: string

  /**
   * Whether this is a local plugin (starts with ~/)
   */
  isLocal: boolean

  /**
   * Alias to use for imports
   */
  alias: string
}

/**
 * Generated virtual module exports interface.
 * This is what consumers will import from 'virtual:motia-plugins'.
 */
export interface VirtualModuleExports {
  /**
   * Array of processed plugin configurations ready to be registered
   */
  plugins: ProcessedPlugin[]
}

/**
 * A plugin configuration after processing and normalization.
 * This is the format used by the workbench to register tabs.
 */
export interface ProcessedPlugin {
  /**
   * Display label for the plugin tab
   */
  label: string

  /**
   * Icon name from lucide-react
   */
  labelIcon: string

  /**
   * Position in the workbench ('top' or 'bottom')
   */
  position: 'top' | 'bottom'

  /**
   * Props to pass to the component
   */
  props: Record<string, any>

  /**
   * The React component to render
   */
  component: any
}

/**
 * Type guard to check if position is valid.
 */
export function isValidPosition(position: any): position is 'top' | 'bottom' {
  return position === 'top' || position === 'bottom'
}

/**
 * Constants used throughout the plugin system.
 */
export const CONSTANTS = {
  /**
   * Virtual module ID for importing plugins
   */
  VIRTUAL_MODULE_ID: 'virtual:motia-plugins',

  /**
   * Resolved virtual module ID (with null byte prefix for Vite)
   */
  RESOLVED_VIRTUAL_MODULE_ID: '\0virtual:motia-plugins',

  /**
   * Log prefix for all plugin messages
   */
  LOG_PREFIX: '[motia-plugins]',

  /**
   * Default values for optional plugin fields
   */
  DEFAULTS: {
    POSITION: 'top' as const,
    LABEL: 'Plugin label',
    ICON: 'toy-brick',
    PROPS: {},
  },
} as const
