import type { MotiaPlugin, MotiaPluginContext } from '@motiadev/core'

export default function plugin(_motia: MotiaPluginContext): MotiaPlugin {
  return {
    workbench: [
      {
        packageName: '@motiadev/plugin-cron',
        cssImports: ['@motiadev/plugin-cron/dist/styles.css'],
        label: 'Cron Jobs',
        position: 'top',
        componentName: 'CronJobsPage',
        labelIcon: 'clock',
      },
    ],
  }
}
