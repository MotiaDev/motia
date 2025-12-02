import { exec, execSync } from 'child_process'
import { existsSync, rmSync } from 'fs'
import path from 'path'
import { configureBullMQProject } from './utils/bullmq-setup'

const TEST_PROJECT_NAME = 'motia-e2e-test-project'
const TEST_PROJECT_PATH = path.join(process.cwd(), TEST_PROJECT_NAME)
const WORKSPACE_ROOT = path.join(process.cwd(), '..', '..')

async function globalSetup() {
  console.log('🚀 Setting up E2E test environment...')

  try {
    if (existsSync(TEST_PROJECT_PATH)) {
      console.log('🧹 Cleaning up existing test project...')
      rmSync(TEST_PROJECT_PATH, { recursive: true, force: true })
    }

    const motiaVersion = process.env.MOTIA_VERSION || 'pre-release'
    const template = process.env.TEST_TEMPLATE || 'motia-tutorial-typescript'

    console.log(`📦 Creating test project with Motia CLI ${motiaVersion} and template ${template}...`)
    const createCommand = `npx motia@${motiaVersion} create  ${TEST_PROJECT_NAME} -t ${template}`

    execSync(createCommand, {
      stdio: 'pipe',
      cwd: process.cwd(),
    })
    execSync(`npm install --save motia@${motiaVersion}`, { cwd: TEST_PROJECT_PATH })

    try {
      execSync(
        `npm install --save @motiadev/plugin-bullmq@${motiaVersion} @motiadev/adapter-bullmq-events@${motiaVersion}`,
        { cwd: TEST_PROJECT_PATH, stdio: 'pipe' },
      )
    } catch (err) {
      console.warn('⚠️ Failed to install BullMQ packages with requested version, falling back to latest.', err)
      execSync(`npm install --save @motiadev/plugin-bullmq @motiadev/adapter-bullmq-events`, {
        cwd: TEST_PROJECT_PATH,
        stdio: 'pipe',
      })
    }

    const { prefix } = configureBullMQProject({ projectPath: TEST_PROJECT_PATH, workspaceRoot: WORKSPACE_ROOT })
    process.env.REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1'
    process.env.REDIS_PORT = process.env.REDIS_PORT || '6379'
    console.log(`🔧 Configured BullMQ adapter with prefix ${prefix}`)

    console.log('🌟 Starting test project server...')
    const serverProcess = exec('npm run dev', {
      cwd: TEST_PROJECT_PATH,
      env: {
        MOTIA_ANALYTICS_DISABLED: 'true',
        REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
        REDIS_PORT: process.env.REDIS_PORT || '6379',
        BULLMQ_PREFIX: process.env.BULLMQ_PREFIX,
        ...process.env,
      },
    })

    console.log('⏳ Waiting for server to be ready...')
    const isWindows = process.platform === 'win32'
    const serverTimeout = isWindows ? 45000 : 60000
    await waitForServer('http://localhost:3000', serverTimeout)

    console.log('✅ E2E test environment setup complete!')

    process.env.TEST_PROJECT_PATH = TEST_PROJECT_PATH
    process.env.TEST_PROJECT_NAME = TEST_PROJECT_NAME
    process.env.TEST_TEMPLATE = template
    process.env.MOTIA_TEST_PID = serverProcess.pid?.toString() || ''
  } catch (error) {
    console.error('❌ Failed to setup E2E test environment:', error)

    if (existsSync(TEST_PROJECT_PATH)) {
      rmSync(TEST_PROJECT_PATH, { recursive: true, force: true })
    }

    throw error
  }
}

async function waitForServer(url: string, timeout: number): Promise<void> {
  const start = Date.now()
  const isWindows = process.platform === 'win32'
  const pollInterval = isWindows ? 1000 : 2000

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch (error) {}

    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  throw new Error(`Server at ${url} did not start within ${timeout}ms`)
}

export default globalSetup
