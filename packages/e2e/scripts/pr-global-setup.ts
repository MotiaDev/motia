import { exec, execSync } from 'child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs'
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

    const template = process.env.MOTIA_TEST_TEMPLATE || 'nodejs'
    const cliPath = process.env.MOTIA_CLI_PATH || path.join(ROOT_PATH, 'packages/snap/dist/cjs/cli.js')

    if (!existsSync(cliPath)) {
      throw new Error(`Built CLI not found at ${cliPath}`)
    }

    console.log(`📦 Creating test project with built CLI and template ${template}...`)

    const createCommand = `node ${cliPath} create  ${TEST_PROJECT_NAME} -t ${template} --confirm`

    execSync(createCommand, {
      stdio: 'pipe',
      cwd: path.join(ROOT_PATH, 'packages'),
    })

    // Update package.json to use workspace references
    console.log('🔗 Updating package.json to use workspace references...')
    const packageJsonPath = path.join(TEST_PROJECT_PATH, 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

    // Update dependencies to use workspace references
    if (packageJson.dependencies?.motia) {
      packageJson.dependencies['motia'] = 'workspace:*'
      packageJson.dependencies['@motiadev/workbench'] = 'workspace:*'
      packageJson.dependencies['@motiadev/core'] = 'workspace:*'
      packageJson.dependencies['@motiadev/plugin-logs'] = 'workspace:*'
      packageJson.dependencies['@motiadev/plugin-states'] = 'workspace:*'
      packageJson.dependencies['@motiadev/plugin-endpoint'] = 'workspace:*'
      packageJson.dependencies['@motiadev/plugin-observability'] = 'workspace:*'
    }

    // Temporarily remove postinstall script to avoid running 'motia install' before dependencies are linked
    const originalPostinstall = packageJson.scripts?.postinstall
    if (packageJson.scripts?.postinstall) {
      delete packageJson.scripts.postinstall
    }

    // Write updated package.json
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

    console.log('📦 Installing dependencies with pnpm...')
    // execSync('pnpm build', { cwd: ROOT_PATH, stdio: 'pipe' })
    execSync('pnpm install', {
      cwd: ROOT_PATH,
      stdio: 'inherit',
      env: {
        ...process.env,
        CI: 'false',
      },
    })

    // Restore postinstall script and run it manually with correct PATH
    if (originalPostinstall) {
      packageJson.scripts = packageJson.scripts || {}
      packageJson.scripts.postinstall = originalPostinstall
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

      console.log('🔧 Running motia install with workspace CLI...')
      execSync(`node ${cliPath} install`, {
        cwd: TEST_PROJECT_PATH,
        stdio: 'inherit',
        env: {
          ...process.env,
          PATH: `${path.dirname(cliPath)}:${process.env.PATH}`,
        },
      })
    }

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
