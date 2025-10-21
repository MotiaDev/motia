import path from 'node:path'
import { config, type MotiaPlugin, type MotiaPluginContext } from '@motiadev/core'

const statesPlugin = require('@motiadev/plugin-states/plugin')
const endpointPlugin = require('@motiadev/plugin-endpoint/plugin')
const logsPlugin = require('@motiadev/plugin-logs/plugin')

function localPluginExample(motia: MotiaPluginContext): MotiaPlugin {
  motia.registerApi(
    {
      method: 'GET',
      path: '/__motia/local-plugin-example',
    },
    async (req, ctx) => {
      return {
        status: 200,
        body: {
          message: 'Hello from Motia Plugin!',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
          status: 'active',
        },
      }
    },
  )

  return {
    dirname: path.join(__dirname, 'plugins'),
    steps: ['**/*.step.ts', '**/*_step.py'],
    workbench: [
      {
        componentName: 'Plugin',
        packageName: '~/plugins',
        label: 'Local Plugin Example',
        position: 'top',
        labelIcon: 'toy-brick',
      },
    ],
  }
}

export default config({
  plugins: [statesPlugin, endpointPlugin, logsPlugin, localPluginExample],
})
