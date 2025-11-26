import { exec, execSync } from 'child_process'
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import path from 'path'

const TEST_PROJECT_NAME = 'motia-e2e-test-project'
const ROOT_PATH = path.join(process.cwd(), '../..')
const TEST_PROJECT_PATH = path.join(ROOT_PATH, 'packages', TEST_PROJECT_NAME)

async function globalSetup() {
  console.log('🚀 Setting up PR E2E test environment...')

  try {
    if (existsSync(TEST_PROJECT_PATH)) {
      console.log('🧹 Cleaning up existing test project...')
      rmSync(TEST_PROJECT_PATH, { recursive: true, force: true })
    }

    const template = process.env.MOTIA_TEST_TEMPLATE || 'motia-tutorial-typescript'
    const cliPath = process.env.MOTIA_CLI_PATH || path.join(ROOT_PATH, 'packages/snap/dist/cli.mjs')

    if (!existsSync(cliPath)) {
      throw new Error(`Built CLI not found at ${cliPath}`)
    }

    console.log(`📦 Creating test project with template ${template}...`)

    // Manually create project structure to avoid npm/pnpm install during create
    mkdirSync(TEST_PROJECT_PATH, { recursive: true })

    // Copy template files
    const templatePath = path.join(ROOT_PATH, 'packages/snap/dist/create/templates', template)
    if (existsSync(templatePath)) {
      cpSync(templatePath, TEST_PROJECT_PATH, { recursive: true, filter: (src) => !src.includes('node_modules') })
    }

    // Create package.json with workspace dependencies
    const packageJsonContent = {
      name: TEST_PROJECT_NAME,
      description: 'E2E test project',
      type: 'module',
      scripts: {
        dev: 'motia dev',
        'generate-types': 'motia generate-types',
        build: 'motia build',
        clean: 'rm -rf dist node_modules python_modules .motia .mermaid',
      },
      dependencies: {
        motia: 'workspace:*',
        '@motiadev/workbench': 'workspace:*',
        '@motiadev/core': 'workspace:*',
        '@motiadev/plugin-logs': 'workspace:*',
        '@motiadev/plugin-states': 'workspace:*',
        '@motiadev/plugin-endpoint': 'workspace:*',
        '@motiadev/plugin-observability': 'workspace:*',
        zod: '4.1.12',
      },
      devDependencies: {
        'ts-node': '10.9.2',
        typescript: '5.7.3',
        '@types/react': '19.1.1',
      },
      keywords: ['motia'],
    }

    writeFileSync(path.join(TEST_PROJECT_PATH, 'package.json'), JSON.stringify(packageJsonContent, null, 2))
    writeFileSync(path.join(TEST_PROJECT_PATH, 'pnpm-lock.yaml'), '')

    console.log('📦 Installing dependencies with pnpm...')
    execSync('pnpm install', {
      cwd: ROOT_PATH,
      stdio: 'inherit',
      env: {
        ...process.env,
        CI: 'false',
      },
    })

    console.log('🔧 Running motia install with workspace CLI...')
    execSync(`node ${cliPath} install`, {
      cwd: TEST_PROJECT_PATH,
      stdio: 'inherit',
      env: {
        ...process.env,
        PATH: `${path.dirname(cliPath)}:${process.env.PATH}`,
      },
    })

    console.log('🌟 Starting test project server...')
    const serverProcess = exec('pnpm run dev', {
      cwd: TEST_PROJECT_PATH,
      env: {
        MOTIA_ANALYTICS_DISABLED: 'true',
        PATH: `${path.dirname(cliPath)}:${process.env.PATH}`,
        ...process.env,
      },
    })

    console.log('⏳ Waiting for server to be ready...')
    await waitForServer('http://localhost:3000', 60000)

    console.log('✅ PR E2E test environment setup complete!')

    process.env.TEST_PROJECT_PATH = TEST_PROJECT_PATH
    process.env.TEST_PROJECT_NAME = TEST_PROJECT_NAME
    process.env.MOTIA_TEST_TEMPLATE = template
    process.env.MOTIA_TEST_PID = serverProcess.pid?.toString() || ''
  } catch (error) {
    console.error('❌ Failed to setup PR E2E test environment:', error)

    if (existsSync(TEST_PROJECT_PATH)) {
      rmSync(TEST_PROJECT_PATH, { recursive: true, force: true })
    }

    throw error
  }
}

async function waitForServer(url: string, timeout: number): Promise<void> {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // Server not ready yet, continue waiting
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new Error(`Server at ${url} did not start within ${timeout}ms`)
}

export default globalSetup
