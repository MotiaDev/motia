import { Motia, MotiaPlugin } from '@motiadev/core'
import { api } from './api'

export default function plugin(motia: Motia): MotiaPlugin {
  api(motia.app, motia.stateAdapter)
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
