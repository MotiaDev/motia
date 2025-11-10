import { createDefaultAdapterOptions, createServer, createStateAdapter, type MotiaPlugin } from '@motiadev/core'
import path from 'path'
import { workbenchBase } from './constants'
import { generateLockedData, getStepFiles } from './generate-locked-data'
import { loadMotiaConfig } from './load-motia-config'
import { processPlugins } from './plugins'
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

  const stepFiles = getStepFiles(baseDir)
  const hasPythonFiles = stepFiles.some((file) => file.endsWith('.py'))

  if (hasPythonFiles) {
    console.log('⚙️ Activating Python environment...')
    activatePythonVenv({ baseDir, isVerbose })
  }

  const motiaFileStoragePath = motiaFileStorageDir || '.motia'

  const dotMotia = path.join(baseDir, motiaFileStoragePath)
  const appConfig = await loadMotiaConfig(baseDir)
  const adapters = {
    ...createDefaultAdapterOptions(baseDir, isVerbose),
    ...appConfig.adapters,
  }
  console.log('adapters', adapters)
  const lockedData = await generateLockedData({
    projectDir: baseDir,
    streamAdapter: adapters.streamAdapter,
  })
  const state = appConfig.adapters?.state || createStateAdapter({ adapter: 'default', filePath: dotMotia })

  const motiaServer = createServer(lockedData, state, adapters)
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
