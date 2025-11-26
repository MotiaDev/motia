import type { MotiaPlugin, MotiaPluginContext } from '@motiadev/core'
import { api } from './api'

export default function plugin(motia: MotiaPluginContext): MotiaPlugin {
  api(motia)

  return {
    workbench: [
      {
        packageName: '@motiadev/plugin-bullmq',
        cssImports: ['@motiadev/plugin-bullmq/dist/plugin-bullmq.css'],
        label: 'Queues',
        position: 'top',
        componentName: 'QueuesPage',
        labelIcon: 'layers',
      },
    ],
  }
}
