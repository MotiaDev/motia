import { createEventManager, createServer, createStateAdapter } from '@motiadev/core'
import path from 'path'
import { stateEndpoints } from './dev/state-endpoints'
import { generateLockedData, getStepFiles } from './generate-locked-data'
import { activatePythonVenv } from './utils/activate-python-env'

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

export const start = async (port: number, hostname: string, disableVerbose: boolean): Promise<void> => {
  const baseDir = process.cwd()
  const isVerbose = !disableVerbose

  const stepFiles = getStepFiles(baseDir)
  const hasPythonFiles = stepFiles.some((file) => file.endsWith('.py'))

  if (hasPythonFiles) {
    console.log('⚙️ Activating Python environment...')
    activatePythonVenv({ baseDir, isVerbose })
  }

  const lockedData = await generateLockedData(baseDir)

  const eventManager = createEventManager()
  const state = createStateAdapter({
    adapter: 'default',
    filePath: path.join(baseDir, '.motia'),
  })

  const config = { isVerbose }
  const motiaServer = createServer(lockedData, eventManager, state, config)

  motiaServer.server.listen(port, hostname)
  console.log('🚀 Server ready and listening on port', port)
  console.log(`🔗 Open http://${hostname}:${port}/ to open workbench 🛠️`)

  if (!process.env.MOTIA_DOCKER_DISABLE_WORKBENCH) {
    stateEndpoints(motiaServer, state)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { applyMiddleware } = require('@motiadev/workbench/dist/middleware')
    await applyMiddleware(motiaServer.app)
  }

  // 6) Gracefully shut down on SIGTERM
  process.on('SIGTERM', async () => {
    motiaServer.server.close()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    motiaServer.server.close()
    process.exit(0)
  })
}
