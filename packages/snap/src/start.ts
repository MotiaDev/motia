import { createEventManager, createServer, createStateAdapter, MotiaPlugin } from '@motiadev/core'
import path from 'path'
import { workbenchBase } from './constants'
import { generateLockedData, getStepFiles } from './generate-locked-data'
import { generatePlugins } from './generate-plugins'
import { activatePythonVenv } from './utils/activate-python-env'
import { version } from './version'

// eslint-disable-next-line @typescript-eslint/no-require-imports
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
  const lockedData = await generateLockedData({ projectDir: baseDir, motiaFileStoragePath })
  const eventManager = createEventManager()
  const state = createStateAdapter({ adapter: 'default', filePath: dotMotia })
  const config = { isVerbose, isDev: false, version }
  const motiaServer = createServer(lockedData, eventManager, state, config)
  const plugins: MotiaPlugin[] = await generatePlugins(motiaServer.motia)

  if (!process.env.MOTIA_DOCKER_DISABLE_WORKBENCH) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
