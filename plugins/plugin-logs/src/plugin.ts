import { Motia, MotiaPlugin } from '@motiadev/core'

export default function plugin(motia: Motia): MotiaPlugin {
  return {
    workbench: [
      {
        packageName: '@motiadev/plugin-logs',
        label: 'Logs',
        position: 'bottom',
        componentName: 'LogsPage',
        labelIcon: 'logs',
      },
    ],
  }
}
