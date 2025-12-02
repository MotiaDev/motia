import { Printer } from '@motiadev/core'
import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import type { WorkbenchPlugin } from '../motia-plugin/types'
import { validatePlugins } from '../motia-plugin/validator'

const printer = new Printer(process.cwd())

/**
 * Generates the plugin code that will be injected into the workbench.
 * In production mode, this sets window.__MOTIA_PLUGINS__ for the pre-built app.
 */
function generatePluginSource(plugins: WorkbenchPlugin[]): string {
  if (!plugins || plugins.length === 0) {
    return 'window.__MOTIA_PLUGINS__ = [];'
  }

  const packages = [...new Set(plugins.map((p) => p.packageName))]

  const imports = packages.map((packageName, index) => `import * as plugin_${index} from '${packageName}'`).join('\n')

  const packageMapEntries = packages.map((packageName, index) => `'${packageName}': plugin_${index}`)

  return `
${imports}

const packageMap = {${packageMapEntries.join(',')}};

const motiaPlugins = ${JSON.stringify(plugins)};

const plugins = motiaPlugins.map((plugin) => {
  const component = packageMap[plugin.packageName];
  const config = component.config || {};
  const componentName = config.componentName || plugin.componentName;

  return {
    label: plugin.label || config.label || 'Plugin label',
    LabelIcon: component.LabelIcon || config.LabelIcon || null,
    position: plugin.position || config.position || 'top',
    props: plugin.props || config.props || {},
    component: componentName ? component[componentName] : component.default,
  };
});

// Set on window for pre-built workbench to access
window.__MOTIA_PLUGINS__ = plugins;

// Dispatch event to notify the app that plugins are ready
window.dispatchEvent(new CustomEvent('motia:plugins-loaded', { detail: plugins }));
`
}

/**
 * Generates CSS imports for plugins.
 */
function generateCssSource(plugins: WorkbenchPlugin[]): string {
  const cssImports = plugins
    .flatMap((plugin) => plugin.cssImports || [])
    .filter((cssImport) => cssImport && cssImport.trim() !== '')

  if (cssImports.length === 0) {
    return ''
  }

  return cssImports.map((cssImport) => `@import '${cssImport}';`).join('\n')
}

export interface BundlePluginsOptions {
  plugins: WorkbenchPlugin[]
  outputDir: string
  workbenchBase: string
  processCwd: string
}

export interface BundleResult {
  jsPath: string
  cssPath: string | null
  manifest: {
    workbenchBase: string
    processCwd: string
    hasPluginJs: boolean
    hasPluginCss: boolean
  }
}

/**
 * Creates an esbuild plugin to resolve ~/ aliases to the project root.
 * Also handles directory imports by resolving to index files.
 */
function createAliasPlugin(processCwd: string): esbuild.Plugin {
  return {
    name: 'alias-resolver',
    setup(build) {
      // Resolve ~/ paths to the project root
      build.onResolve({ filter: /^~\// }, (args) => {
        const relativePath = args.path.slice(2) // Remove ~/
        let absolutePath = path.resolve(processCwd, relativePath)

        // Check if this is a directory and resolve to index file
        if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
          // Try common index files
          const indexFiles = ['index.tsx', 'index.ts', 'index.jsx', 'index.js']
          for (const indexFile of indexFiles) {
            const indexPath = path.join(absolutePath, indexFile)
            if (fs.existsSync(indexPath)) {
              absolutePath = indexPath
              break
            }
          }
        }

        return { path: absolutePath }
      })
    },
  }
}

/**
 * Bundles plugins using esbuild (much lighter than Vite).
 *
 * This produces:
 * - plugins.js: The bundled plugin code
 * - plugins.css: Any CSS from plugins (if any)
 * - manifest.json: Metadata for the middleware
 */
export async function bundlePlugins(options: BundlePluginsOptions): Promise<BundleResult> {
  const { plugins, outputDir, workbenchBase, processCwd } = options

  // Validate plugins
  const validationResult = validatePlugins(plugins, { failFast: false })

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

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true })

  const pluginSource = generatePluginSource(plugins)
  const cssSource = generateCssSource(plugins)

  // Write temporary source files
  const tempDir = path.join(outputDir, '.temp')
  fs.mkdirSync(tempDir, { recursive: true })

  const pluginEntryPath = path.join(tempDir, 'plugins-entry.tsx')
  fs.writeFileSync(pluginEntryPath, pluginSource)

  const jsOutputPath = path.join(outputDir, 'plugins.js')
  let cssOutputPath: string | null = null

  try {
    // Bundle plugin JavaScript
    await esbuild.build({
      entryPoints: [pluginEntryPath],
      bundle: true,
      format: 'esm',
      outfile: jsOutputPath,
      platform: 'browser',
      target: ['es2020'],
      jsx: 'automatic',
      minify: false, // Keep readable for debugging
      sourcemap: true,
      external: [
        // External React (provided by workbench)
        'react',
        'react-dom',
        'react/jsx-runtime',
      ],
      plugins: [createAliasPlugin(processCwd)],
      define: {
        'process.env.NODE_ENV': '"development"',
      },
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js',
        '.css': 'css',
      },
      // Resolve from user's project and workbench
      nodePaths: [
        path.join(processCwd, 'node_modules'),
        path.join(__dirname, '..', 'node_modules'),
        path.join(__dirname, '..', '..', 'node_modules'),
      ],
    })

    printer.printPluginLog(`Bundled ${plugins.length} plugin(s) → ${jsOutputPath}`)

    // Bundle plugin CSS if any (non-fatal - CSS may be bundled in main app)
    if (cssSource) {
      cssOutputPath = path.join(outputDir, 'plugins.css')
      const cssEntryPath = path.join(tempDir, 'plugins-entry.css')
      fs.writeFileSync(cssEntryPath, cssSource)

      try {
        await esbuild.build({
          entryPoints: [cssEntryPath],
          bundle: true,
          outfile: cssOutputPath,
          loader: {
            '.css': 'css',
          },
          nodePaths: [path.join(processCwd, 'node_modules'), path.join(__dirname, '..', 'node_modules')],
          logLevel: 'silent',
        })

        printer.printPluginLog(`Bundled plugin CSS → ${cssOutputPath}`)
      } catch (cssError) {
        // CSS bundling is optional - plugins may rely on pre-bundled CSS
        printer.printPluginWarn(`Plugin CSS bundling skipped (styles may be pre-bundled)`)
        cssOutputPath = null
      }
    }

    // Write manifest
    const manifest = {
      workbenchBase,
      processCwd,
      hasPluginJs: true,
      hasPluginCss: cssOutputPath !== null,
      generatedAt: new Date().toISOString(),
    }

    fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

    // Cleanup temp directory
    fs.rmSync(tempDir, { recursive: true, force: true })

    return {
      jsPath: jsOutputPath,
      cssPath: cssOutputPath,
      manifest,
    }
  } catch (error) {
    // Cleanup on error
    fs.rmSync(tempDir, { recursive: true, force: true })
    throw error
  }
}

/**
 * Watches plugins for changes and rebuilds (for development).
 * This provides HMR-like functionality using esbuild's watch mode.
 */
export async function watchPlugins(
  options: BundlePluginsOptions,
  onChange?: (result: BundleResult) => void,
): Promise<{ stop: () => void }> {
  // Initial build
  let result = await bundlePlugins(options)
  onChange?.(result)

  // Set up file watchers for local plugins
  const localPlugins = options.plugins.filter((p) => p.packageName.startsWith('./') || p.packageName.startsWith('~/'))

  if (localPlugins.length === 0) {
    return { stop: () => {} }
  }

  const chokidarModule = await import('chokidar')
  const chokidar = chokidarModule.default || chokidarModule
  const watchPaths = localPlugins.map((p) => {
    const pluginPath = p.packageName.replace('~/', `${options.processCwd}/`)
    return path.resolve(options.processCwd, pluginPath)
  })

  const watcher = chokidar.watch(watchPaths, {
    ignoreInitial: true,
    ignored: /node_modules/,
  })

  watcher.on('change', async () => {
    try {
      result = await bundlePlugins(options)
      onChange?.(result)
    } catch (error) {
      printer.printPluginError(`Failed to rebuild plugins: ${error}`)
    }
  })

  return {
    stop: () => {
      watcher.close()
    },
  }
}
