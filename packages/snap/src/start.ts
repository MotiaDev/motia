// packages/snap/src/dev.ts
import { createEventManager, createServer, createStateAdapter, getProjectIdentifier, trackEvent } from '@motiadev/core'
import path from 'path'
import { flush } from '@amplitude/analytics-node'
import { generateLockedData, getStepFiles } from './generate-locked-data'
import { stateEndpoints } from './dev/state-endpoints'
import { activatePythonVenv } from './utils/activate-python-env'
import { identifyUser } from './utils/analytics'
import { version } from './version'

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

export const start = async (port: number, disableVerbose: boolean): Promise<void> => {
  const baseDir = process.cwd()
  const isVerbose = !disableVerbose

  identifyUser()

  const stepFiles = getStepFiles(baseDir)
  const hasPythonFiles = stepFiles.some((file) => file.endsWith('.py'))

  trackEvent('server_started', {
    port,
    verbose_mode: isVerbose,
    has_python_files: hasPythonFiles,
    total_step_files: stepFiles.length,
    project_name: getProjectIdentifier(baseDir),
  })

  if (hasPythonFiles) {
    console.log('⚙️ Activating Python environment...')
    activatePythonVenv({ baseDir, isVerbose })
    trackEvent('python_environment_activated')
  }

  const lockedData = await generateLockedData(baseDir)

  const eventManager = createEventManager()
  const state = createStateAdapter({
    adapter: 'default',
    filePath: path.join(baseDir, '.motia'),
  })

  const config = { isVerbose }
  const motiaServer = createServer(lockedData, eventManager, state, config)

  stateEndpoints(motiaServer, state)

  motiaServer.server.listen(port)
  console.log('🚀 Server ready and listening on port', port)
  console.log(`🔗 Open http://localhost:${port}/ to open workbench 🛠️`)

  trackEvent('server_ready', {
    port,
    flows_count: lockedData.flows?.length || 0,
    steps_count: lockedData.activeSteps?.length || 0,
    flows: Object.keys(lockedData.flows || {}),
    steps: lockedData.activeSteps.map((step) => step.config.name),
    streams: Object.keys(lockedData.getStreams() || {}),
    runtime_version: version,
    environment: process.env.NODE_ENV || 'development',
  })

  if (!process.env.MOTIA_DOCKER_DISABLE_WORKBENCH) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { applyMiddleware } = require('@motiadev/workbench/dist/middleware')
    await applyMiddleware(motiaServer.app)
  }

  // 6) Gracefully shut down on SIGTERM
  process.on('SIGTERM', async () => {
    trackEvent('server_shutdown', { reason: 'SIGTERM' })
    motiaServer.server.close()
    await flush().promise
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    trackEvent('server_shutdown', { reason: 'SIGINT' })
    motiaServer.server.close()
    await flush().promise
    process.exit(0)
  })
}
