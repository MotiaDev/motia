import { flush } from '@amplitude/analytics-node'
import { BullMQEventAdapter } from '@motiadev/adapter-bullmq-events'
import { RedisCronAdapter } from '@motiadev/adapter-redis-cron'
import { RedisStateAdapter } from '@motiadev/adapter-redis-state'
import { RedisStreamAdapterManager } from '@motiadev/adapter-redis-streams'
import { createServer, getProjectIdentifier, type MotiaPlugin, trackEvent } from '@motiadev/core'
import path from 'path'
import type { RedisClientType } from 'redis'
import { workbenchBase } from './constants'
import { generateLockedData, getStepFiles, getStreamFiles } from './generate-locked-data'
import { loadMotiaConfig } from './load-motia-config'
import { processPlugins } from './plugins/index'
import { getRedisClient, getRedisConnectionInfo, stopRedisConnection } from './redis/connection'
import { activatePythonVenv } from './utils/activate-python-env'
import { identifyUser } from './utils/analytics'
import { listenWithFallback } from './utils/listen-with-fallback'
import { validatePythonEnvironment } from './utils/validate-python-environment'
import { version } from './version'

export const start = async (
  port: number,
  hostname: string,
  disableVerbose: boolean,
  motiaFileStorageDir?: string,
): Promise<void> => {
  const baseDir = process.cwd()
  const isVerbose = !disableVerbose

  identifyUser()

  const stepFiles = [...getStepFiles(baseDir), ...getStreamFiles(baseDir)]
  const hasPythonFiles = stepFiles.some((file) => file.endsWith('.py'))

  trackEvent('server_started', {
    port,
    verbose_mode: isVerbose,
    has_python_files: hasPythonFiles,
    total_step_files: stepFiles.length,
    project_name: getProjectIdentifier(baseDir),
  })

  const pythonValidation = await validatePythonEnvironment({ baseDir, hasPythonFiles })
  if (!pythonValidation.success) {
    process.exit(1)
  }

  if (pythonValidation.hasPythonFiles) {
    console.log('⚙️ Activating Python environment...')
    activatePythonVenv({ baseDir, isVerbose })
  }

  const motiaFileStoragePath = motiaFileStorageDir || '.motia'

  const dotMotia = path.join(baseDir, motiaFileStoragePath)
  const appConfig = await loadMotiaConfig(baseDir)

  const redisClient: RedisClientType = await getRedisClient(dotMotia, appConfig)

  const adapters = {
    eventAdapter:
      appConfig.adapters?.events ||
      new BullMQEventAdapter({
        connection: getRedisConnectionInfo(),
      }),
    cronAdapter: appConfig.adapters?.cron || new RedisCronAdapter(redisClient),
    streamAdapter: appConfig.adapters?.streams || new RedisStreamAdapterManager(redisClient),
  }
  const lockedData = await generateLockedData({
    projectDir: baseDir,
    streamAdapter: adapters.streamAdapter,
    redisClient,
    streamAuth: appConfig.streamAuth,
  })

  const state = appConfig.adapters?.state || new RedisStateAdapter(redisClient)

  const config = { isVerbose, isDev: false, version }

  const motiaServer = createServer(lockedData, state, config, adapters, appConfig.app)
  const plugins: MotiaPlugin[] = await processPlugins(motiaServer)

  if (!process.env.MOTIA_DOCKER_DISABLE_WORKBENCH) {
    const { applyMiddleware } = await import('@motiadev/workbench/middleware')
    await applyMiddleware({
      app: motiaServer.app,
      port,
      workbenchBase,
      plugins: plugins.flatMap((item) => item.workbench),
    })
  }

  const actualPort = await listenWithFallback(motiaServer.server, port, hostname)
  if (actualPort !== port) {
    console.log(`⚠️  Port ${port} was in use, using port ${actualPort} instead`)
  }
  console.log('🚀 Server ready and listening on port', actualPort)
  console.log(`🔗 Open http://${hostname}:${actualPort}${workbenchBase} to open workbench 🛠️`)

  process.on('SIGTERM', async () => {
    trackEvent('server_shutdown', { reason: 'SIGTERM' })
    motiaServer.server.close()
    await stopRedisConnection()
    await flush().promise
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    trackEvent('server_shutdown', { reason: 'SIGINT' })
    motiaServer.server.close()
    await stopRedisConnection()
    await flush().promise
    process.exit(0)
  })
}
