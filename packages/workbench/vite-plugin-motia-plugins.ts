import path from 'path'
import type { Plugin } from 'vite'

export interface WorkbenchPlugin {
  packageName: string
  componentName?: string
  position?: 'top' | 'bottom'
  label?: string
  cssImports?: string[]
  props?: Record<string, any>
}

const VIRTUAL_MODULE_ID = 'virtual:motia-plugins'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

export default function motiaPluginsPlugin(plugins: WorkbenchPlugin[]): Plugin {
  const packages = Array.from(new Set(plugins.map(({ packageName }) => packageName)))
  const alias = packages.reduce((acc, packageName) => {
    if (packageName.startsWith('~/')) {
      return {
        ...acc,
        [packageName]: path.join(process.cwd(), './', packageName.replace('~/', '')),
      }
    }

    return {
      ...acc,
      [packageName]: path.join(process.cwd(), './node_modules', packageName),
    }
  }, {})

  const generatePluginCode = (): string => {
    const imports = packages.map((packageName, index) => `import * as plugin_${index} from '${packageName}'`).join('\n')

    const importsMap = packages.map((packageName, index) => `'${packageName}': plugin_${index}`)

    return `
      ${imports}
      const packageMap = {${importsMap}}
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

  return {
    name: 'vite-plugin-motia-plugins',
    enforce: 'pre',
    async transform(code, id) {
      if (id.replace(/\\/g, '/').endsWith('/workbench/src/index.css')) {
        const cssImports = plugins
          .flatMap((item) => item.cssImports)
          .filter(Boolean)
          .map((packageName) => `@import '${packageName}';`)
          .join('\n')

        return `${cssImports}\n${code}`
      }
      return null
    },
    config: () => ({
      resolve: {
        alias,
      },
    }),
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        console.log(`[motia-plugins] Loading plugins`)
        const code = generatePluginCode()

        if (!code) {
          console.log('[motia-plugins] No plugins found')
          return ''
        }
        return code
      }
    },
  }
}
