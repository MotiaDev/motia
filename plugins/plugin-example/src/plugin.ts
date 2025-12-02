import type { MotiaPlugin, MotiaPluginContext } from '@motiadev/core'

export default function plugin(_motia: MotiaPluginContext): MotiaPlugin {
  return {
    workbench: [
      {
        packageName: '@motiadev/plugin-example',
        cssImports: ['@motiadev/plugin-example/dist/index.css'],
        label: 'Example',
        position: 'bottom',
        componentName: 'ExamplePage',
        labelIcon: 'sparkles',
      },
    ],
  }
}
