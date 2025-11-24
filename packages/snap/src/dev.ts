import { flush } from '@amplitude/analytics-node'
import { BullMQEventAdapter } from '@motiadev/adapter-bullmq-events'
import { RedisStateAdapter } from '@motiadev/adapter-redis-state'
import { RedisStreamAdapterManager } from '@motiadev/adapter-redis-streams'
import {
  createMermaidGenerator,
  createServer,
  DefaultCronAdapter,
  getProjectIdentifier,
  type MotiaPlugin,
  trackEvent,
} from '@motiadev/core'
import type { RedisClientType } from 'redis'
import { deployEndpoints } from './cloud/endpoints'
import { isTutorialDisabled, workbenchBase } from './constants'
import { createDevWatchers } from './dev-watchers'
import { generateLockedData, getStepFiles, getStreamFiles } from './generate-locked-data'
import { loadMotiaConfig } from './load-motia-config'
import { processPlugins } from './plugins'
import { instanceRedisMemoryServer, stopRedisMemoryServer } from './redis-memory-manager'
import { activatePythonVenv } from './utils/activate-python-env'
import { identifyUser } from './utils/analytics'
import { version } from './version'

process.env.VITE_CJS_IGNORE_WARNING = 'true'

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

export const dev = async (
  port: number,
  hostname: string,
  disableVerbose: boolean,
  enableMermaid: boolean,
  motiaFileStorageDir?: string,
): Promise<void> => {
  const baseDir = process.cwd()
  const isVerbose = !disableVerbose

  identifyUser()

  const stepFiles = [...getStepFiles(baseDir), ...getStreamFiles(baseDir)]
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

  const motiaFileStoragePath = motiaFileStorageDir || '.motia'

  const appConfig = await loadMotiaConfig(baseDir)

  const redisClient: RedisClientType = await instanceRedisMemoryServer(motiaFileStoragePath, true)

  const adapters = {
    eventAdapter:
      appConfig.adapters?.events ||
      new BullMQEventAdapter({
        connection: {
          host: (redisClient.options.socket as { host?: string })?.host || 'localhost',
          port: (redisClient.options.socket as { port?: number })?.port || 6379,
        },
        prefix: 'motia:events',
      }),
    cronAdapter: appConfig.adapters?.cron || new DefaultCronAdapter(),
    streamAdapter: appConfig.adapters?.streams || new RedisStreamAdapterManager(redisClient),
  }

  const lockedData = await generateLockedData({
    projectDir: baseDir,
    streamAdapter: adapters.streamAdapter,
    redisClient,
    streamAuth: appConfig.streamAuth,
  })

  const state = appConfig.adapters?.state || new RedisStateAdapter(redisClient)

  const config = { isVerbose }

  const motiaServer = createServer(lockedData, state, config, adapters, appConfig.app)
  const watcher = createDevWatchers(lockedData, motiaServer, motiaServer.motiaEventManager, motiaServer.cronManager)
  const plugins: MotiaPlugin[] = await processPlugins(motiaServer)

  // Initialize mermaid generator
  if (enableMermaid) {
    const mermaidGenerator = createMermaidGenerator(baseDir)
    mermaidGenerator.initialize(lockedData)
    trackEvent('mermaid_generator_initialized')
  }

  deployEndpoints(motiaServer, lockedData)

  motiaServer.app.get('/__motia', (_, res) => {
    const meta = {
      version,
      isDev: true,
      isTutorialDisabled,
      workbenchBase,
    }

    res //
      .header('Access-Control-Allow-Origin', '*')
      .header('Access-Control-Allow-Private-Network', 'true')
      .status(200)
      .json(meta)
  })

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
    ? require('@motiadev/workbench/middleware')
    : require('@motiadev/workbench/dist/middleware')
  await applyMiddleware({
    app: motiaServer.app,
    port,
    workbenchBase,
    plugins: plugins.flatMap((item) => item.workbench),
  })

  motiaServer.server.listen(port, hostname)
  console.log('🚀 Server ready and listening on port', port)
  console.log(`🔗 Open http://localhost:${port}${workbenchBase} to open workbench 🛠️`)

  process.on('SIGTERM', async () => {
    trackEvent('dev_server_shutdown', { reason: 'SIGTERM' })
    motiaServer.server.close()
    await watcher.stop()
    await stopRedisMemoryServer()
    await flush().promise
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    trackEvent('dev_server_shutdown', { reason: 'SIGINT' })
    motiaServer.server.close()
    await watcher.stop()
    await stopRedisMemoryServer()
    await flush().promise
    process.exit(0)
  })
}
