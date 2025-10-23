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
    if (packageJson.dependencies && packageJson.dependencies['motia']) {
      packageJson.dependencies['motia'] = 'workspace:*'
      packageJson.dependencies['@motiadev/workbench'] = 'workspace:*'
      packageJson.dependencies['@motiadev/core'] = 'workspace:*'
      packageJson.dependencies['@motiadev/plugin-logs'] = 'workspace:*'
      packageJson.dependencies['@motiadev/plugin-states'] = 'workspace:*'
      packageJson.dependencies['@motiadev/plugin-endpoint'] = 'workspace:*'
      packageJson.dependencies['@motiadev/plugin-observability'] = 'workspace:*'
    }

    // Write updated package.json
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

    injectLargePayloadStep(template)

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
    } catch (error) {
      // Server not ready yet, continue waiting
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new Error(`Server at ${url} did not start within ${timeout}ms`)
}

function injectLargePayloadStep(template: string) {
  try {
    console.log(`[LargePayload][Setup] Injecting step for template="${template}"`)

    const stepsDir = path.join(TEST_PROJECT_PATH, 'steps')

    if (!existsSync(stepsDir)) {
      console.warn(`⚠️ Steps directory not found at ${stepsDir}, skipping large payload step injection`)
      return
    }

    if (template === 'python') {
      const pythonStepPath = path.join(stepsDir, 'large_payload_step.py')
      const pythonStep = `config = {
    "type": "api",
    "name": "large-payload-endpoint",
    "method": "POST",
    "path": "/api/large-payload",
    "emits": [],
    "flows": ["basic-tutorial"],
}


async def handler(req, context):
    body = req.get("body", {})
    data = body.get("data", "")

    if isinstance(data, (bytes, bytearray)):
        length = len(data)
    elif isinstance(data, str):
        length = len(data.encode("utf-8"))
    else:
        length = 0

    return {"status": 200, "body": {"byteLength": length}}
`
      safeWriteFile(pythonStepPath, pythonStep)
      registerStepInWorkbench('steps/large_payload_step.py')
      return
    }

    const nodeStepPath = path.join(stepsDir, 'large-payload.step.ts')
    const nodeStep = `import type { ApiRouteConfig } from 'motia'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'large-payload-endpoint',
  method: 'POST',
  path: '/api/large-payload',
  emits: [],
  flows: ['basic-tutorial'],
}

type RequestBody = { body?: { data?: unknown } }

export const handler = async (req: RequestBody) => {
  const data = req.body?.data
  const text = typeof data === 'string' ? data : ''

  return {
    status: 200,
    body: {
      byteLength: Buffer.byteLength(text),
    },
  }
}
`
    safeWriteFile(nodeStepPath, nodeStep)
    registerStepInWorkbench('steps/large-payload.step.ts')
  } catch (error) {
    console.error('[LargePayload][Setup] Unexpected error while injecting large payload step', error)
  }
}

function safeWriteFile(targetPath: string, contents: string) {
  try {
    writeFileSync(targetPath, contents)
    console.log(`[LargePayload][Setup] wrote file ${targetPath}`)
  } catch (error) {
    console.error(`[LargePayload][Setup] failed to write file ${targetPath}`, error)
    throw error
  }

  if (!existsSync(targetPath)) {
    console.warn(`[LargePayload][Setup] file missing after write: ${targetPath}`)
  }
}

function registerStepInWorkbench(stepPath: string) {
  const workbenchPath = path.join(TEST_PROJECT_PATH, 'motia-workbench.json')

  try {
    if (!existsSync(workbenchPath)) {
      console.warn(`[LargePayload][Setup] motia-workbench.json not found at ${workbenchPath}`)
      return
    }

    const raw = readFileSync(workbenchPath, 'utf8')
    const data = JSON.parse(raw)
    const basicFlow = Array.isArray(data) ? data.find((flow: any) => flow.id === 'basic-tutorial') : null

    if (!basicFlow?.config) {
      console.warn('[LargePayload][Setup] basic-tutorial flow missing, skipping workbench update')
      return
    }

    if (!basicFlow.config[stepPath]) {
      basicFlow.config[stepPath] = { x: 420, y: 420 }
      writeFileSync(workbenchPath, JSON.stringify(data, null, 2))
      console.log(`[LargePayload][Setup] registered ${stepPath} in motia-workbench.json`)
    } else {
      console.log(`[LargePayload][Setup] ${stepPath} already present in motia-workbench.json`)
    }
  } catch (error) {
    console.error('[LargePayload][Setup] failed to update motia-workbench.json', error)
  }
}

export default globalSetup
