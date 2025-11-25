import { RedisStateAdapter } from '@motiadev/adapter-redis-state'
import { RedisStreamAdapterManager } from '@motiadev/adapter-redis-streams'
import { createServer, DefaultCronAdapter, DefaultQueueEventAdapter, type MotiaPlugin } from '@motiadev/core'
import path from 'path'
import type { RedisClientType } from 'redis'
import { workbenchBase } from './constants'
import { generateLockedData, getStepFiles, getStreamFiles } from './generate-locked-data'
import { loadMotiaConfig } from './load-motia-config'
import { processPlugins } from './plugins'
import { instanceRedisMemoryServer, stopRedisMemoryServer } from './redis-memory-manager'
import { activatePythonVenv } from './utils/activate-python-env'
import { version } from './version'

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

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

  const redisClient: RedisClientType = await instanceRedisMemoryServer(dotMotia)

  const adapters = {
    eventAdapter: appConfig.adapters?.events || new DefaultQueueEventAdapter(),
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

  const config = { isVerbose, isDev: false, version }

  const motiaServer = createServer(lockedData, state, config, adapters, appConfig.app)
  const plugins: MotiaPlugin[] = await processPlugins(motiaServer)

  if (!process.env.MOTIA_DOCKER_DISABLE_WORKBENCH) {
    const { applyMiddleware } = require('@motiadev/workbench/dist/middleware')
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
    await stopRedisMemoryServer()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    motiaServer.server.close()
    await stopRedisMemoryServer()
    process.exit(0)
  })
}
