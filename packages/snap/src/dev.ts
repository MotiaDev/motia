// packages/snap/src/dev.ts
import {
  createEventManager,
  createMermaidGenerator,
  createServer,
  createStateAdapter,
  getProjectIdentifier,
  trackEvent,
} from '@motiadev/core'
import path from 'path'
import { flush } from '@amplitude/analytics-node'
import { generateLockedData, getStepFiles } from './generate-locked-data'
import { createDevWatchers } from './dev-watchers'
import { stateEndpoints } from './dev/state-endpoints'
import { activatePythonVenv } from './utils/activate-python-env'
import { identifyUser } from './utils/analytics'
import { version } from './version'

process.env.VITE_CJS_IGNORE_WARNING = 'true'

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

export const dev = async (
  port: number,
  hostname: string,
  disableVerbose: boolean,
  enableMermaid: boolean,
): Promise<void> => {
  const baseDir = process.cwd()
  const isVerbose = !disableVerbose

  identifyUser()

  const stepFiles = getStepFiles(baseDir)
  const hasPythonFiles = stepFiles.some((file) => file.endsWith('.py'))

  trackEvent('dev_server_started', {
    port,
    verbose_mode: isVerbose,
    mermaid_enabled: enableMermaid,
    has_python_files: hasPythonFiles,
    total_step_files: stepFiles.length,
    project_name: getProjectIdentifier(baseDir),
  })

  if (hasPythonFiles) {
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
  const watcher = createDevWatchers(lockedData, motiaServer, motiaServer.motiaEventManager, motiaServer.cronManager)

  // Initialize mermaid generator
  if (enableMermaid) {
    const mermaidGenerator = createMermaidGenerator(baseDir)
    mermaidGenerator.initialize(lockedData)
    trackEvent('mermaid_generator_initialized')
  }

  watcher.init()

  stateEndpoints(motiaServer, state)

  motiaServer.server.listen(port, hostname)
  console.log('🚀 Server ready and listening on port', port)
  console.log(`🔗 Open http://${hostname}:${port}/ to open workbench 🛠️`)

  trackEvent('dev_server_ready', {
    port,
    flows_count: lockedData.flows?.length || 0,
    steps_count: lockedData.activeSteps?.length || 0,
    flows: Object.keys(lockedData.flows || {}),
    steps: lockedData.activeSteps.map((step) => step.config.name),
    streams: Object.keys(lockedData.getStreams() || {}),
    runtime_version: version,
    environment: process.env.NODE_ENV || 'development',
  })

  const { applyMiddleware } = process.env.__MOTIA_DEV_MODE__
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@motiadev/workbench/middleware')
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@motiadev/workbench/dist/middleware')
  await applyMiddleware(motiaServer.app)

  // 6) Gracefully shut down on SIGTERM
  process.on('SIGTERM', async () => {
    trackEvent('dev_server_shutdown', { reason: 'SIGTERM' })
    motiaServer.server.close()
    await watcher.stop()
    await flush().promise
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    trackEvent('dev_server_shutdown', { reason: 'SIGINT' })
    motiaServer.server.close()
    await watcher.stop()
    await flush().promise
    process.exit(0)
  })
}
