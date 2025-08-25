import { execSync, exec } from 'child_process'
import { existsSync, rmSync } from 'fs'
import path from 'path'

const TEST_PROJECT_NAME = 'motia-e2e-test-project'
const TEST_PROJECT_PATH = path.join(process.cwd(), TEST_PROJECT_NAME)

async function globalSetup() {
  console.log('🚀 Setting up PR E2E test environment...')

  try {
    if (existsSync(TEST_PROJECT_PATH)) {
      console.log('🧹 Cleaning up existing test project...')
      rmSync(TEST_PROJECT_PATH, { recursive: true, force: true })
    }

    const template = process.env.TEST_TEMPLATE || 'nodejs'
    const cliPath = process.env.MOTIA_CLI_PATH || path.join(process.cwd(), '../../packages/snap/dist/cjs/cli.js')
    
    // Verify CLI exists
    if (!existsSync(cliPath)) {
      throw new Error(`Built CLI not found at ${cliPath}`)
    }

    console.log(`📦 Creating test project with built CLI and template ${template}...`)
    let createCommand = `node ${cliPath} create -n ${TEST_PROJECT_NAME} -d`
    if (template === 'python') {
      createCommand += ' -t python'
    }
    
    execSync(createCommand, {
      stdio: 'pipe',
      cwd: process.cwd()
    })

    // Link local packages instead of installing from npm
    console.log('🔗 Linking local packages...')
    const packagesToCopy = [
      '@motiadev/core',
      '@motiadev/workbench',
      '@motiadev/stream-client',
      '@motiadev/stream-client-browser',
      '@motiadev/stream-client-node',
      '@motiadev/stream-client-react',
      '@motiadev/test',
      '@motiadev/ui'
    ]

    // Update package.json to use local packages
    const packageJsonPath = path.join(TEST_PROJECT_PATH, 'package.json')
    const packageJson = JSON.parse(execSync(`cat ${packageJsonPath}`, { encoding: 'utf8' }))
    
    // Update dependencies to use local file paths
    for (const pkg of packagesToCopy) {
      if (packageJson.dependencies && packageJson.dependencies[pkg]) {
        const localPath = path.join(process.cwd(), '../../packages', pkg.replace('@motiadev/', ''))
        packageJson.dependencies[pkg] = `file:${localPath}`
      }
    }
    
    // Add local motia package
    const snapPath = path.join(process.cwd(), '../../packages/snap')
    packageJson.dependencies['motia'] = `file:${snapPath}`
    
    // Write updated package.json
    execSync(`echo '${JSON.stringify(packageJson, null, 2)}' > ${packageJsonPath}`)
    
    // Install dependencies with local packages
    execSync('npm install', { cwd: TEST_PROJECT_PATH })

    console.log('🌟 Starting test project server...')
    const serverProcess = exec('npm run dev', { 
      cwd: TEST_PROJECT_PATH, 
      env: {
        MOTIA_ANALYTICS_DISABLED: 'true',
        PATH: `${path.dirname(cliPath)}:${process.env.PATH}`,
        ...process.env
      }
    })

    console.log('⏳ Waiting for server to be ready...')
    await waitForServer('http://localhost:3000', 60000)

    console.log('✅ PR E2E test environment setup complete!')

    process.env.TEST_PROJECT_PATH = TEST_PROJECT_PATH
    process.env.TEST_PROJECT_NAME = TEST_PROJECT_NAME
    process.env.TEST_TEMPLATE = template
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
    } catch (error) {
      // Server not ready yet, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  throw new Error(`Server at ${url} did not start within ${timeout}ms`)
}

export default globalSetup