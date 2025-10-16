import { config, type Motia } from '@motiadev/core'

const statesPlugin = require('@motiadev/plugin-states/plugin')
const endpointPlugin = require('@motiadev/plugin-endpoint/plugin')
const logsPlugin = require('@motiadev/plugin-logs/plugin')

function localPluginExample({ app }: Motia) {
  app.get('/__motia/local-plugin-example', async (req, res) => {
    res.json({
      message: 'Hello from Motia Plugin!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      status: 'active',
    })
  })

  return {
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
