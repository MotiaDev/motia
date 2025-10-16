import { Motia, MotiaPlugin } from '@motiadev/core'

export default function plugin(motia: Motia): MotiaPlugin {
  return {
    workbench: [
      {
        packageName: '@motiadev/plugin-endpoint',
        cssImports: ['@motiadev/plugin-endpoint/dist/plugin-endpoint.css'],
        label: 'Endpoints',
        position: 'top',
        componentName: 'EndpointsPage',
        labelIcon: 'link-2',
      },
    ],
  }
}
