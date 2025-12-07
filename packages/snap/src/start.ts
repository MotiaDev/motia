import { BullMQEventAdapter } from '@motiadev/adapter-bullmq-events'
import { RedisCronAdapter } from '@motiadev/adapter-redis-cron'
import { RedisStateAdapter } from '@motiadev/adapter-redis-state'
import { RedisStreamAdapterManager } from '@motiadev/adapter-redis-streams'
import { createServer, type MotiaPlugin } from '@motiadev/core'
import path from 'path'
import type { RedisClientType } from 'redis'
import { workbenchBase } from './constants'
import { generateLockedData, getStepFiles, getStreamFiles } from './generate-locked-data'
import { loadMotiaConfig } from './load-motia-config'
import { processPlugins } from './plugins/index'
import { getRedisClient, stopRedisConnection } from './redis/connection'
import { activatePythonVenv } from './utils/activate-python-env'
import { version } from './version'

export const start = async (
  port: number,
  hostname: string,
  disableVerbose: boolean,
  motiaFileStorageDir?: string,
): Promise<void> => {
  const baseDir = process.cwd()
  const isVerbose = !disableVerbose

  const stepFiles = [...getStepFiles(baseDir), ...getStreamFiles(baseDir)]
  const hasPythonFiles = stepFiles.some((file) => file.endsWith('.py'))

  if (hasPythonFiles) {
    console.log('⚙️ Activating Python environment...')
    activatePythonVenv({ baseDir, isVerbose })
  }

  const motiaFileStoragePath = motiaFileStorageDir || '.motia'

  const dotMotia = path.join(baseDir, motiaFileStoragePath)
  const appConfig = await loadMotiaConfig(baseDir)

  const redisClient: RedisClientType = await getRedisClient(dotMotia, appConfig, true)

  const adapters = {
    eventAdapter:
      appConfig.adapters?.events ||
      new BullMQEventAdapter({
        connection: {
          host: (redisClient.options.socket as { host?: string })?.host || 'localhost',
          port: (redisClient.options.socket as { port?: number })?.port || 6379,
        },
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

  motiaServer.server.listen(port, hostname)
  console.log('🚀 Server ready and listening on port', port)
  console.log(`🔗 Open http://${hostname}:${port}${workbenchBase} to open workbench 🛠️`)

  process.on('SIGTERM', async () => {
    motiaServer.server.close()
    await stopRedisConnection()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    motiaServer.server.close()
    await stopRedisConnection()
    process.exit(0)
  })
}
