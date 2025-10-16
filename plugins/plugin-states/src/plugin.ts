import type { MotiaPlugin, MotiaPluginContext } from '@motiadev/core'
import { api } from './api'

export default function plugin(motia: MotiaPluginContext): MotiaPlugin {
  api(motia.app, motia.state)
  return {
    workbench: [
      {
        packageName: '@motiadev/plugin-states',
        cssImports: ['@motiadev/plugin-states/dist/plugin-states.css'],
        label: 'States',
        position: 'bottom',
        componentName: 'StatesPage',
        labelIcon: 'file',
      },
    ],
  }
}
