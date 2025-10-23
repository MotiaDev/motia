import { exec, execSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
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

    const petstoreDir = path.join(stepsDir, 'petstore')
    ensureDir(petstoreDir)

    if (template === 'python') {
      const relativeStepPath = 'steps/petstore/large_payload_step.py'
      const pythonStepPath = path.join(TEST_PROJECT_PATH, relativeStepPath)
      const pythonStep = `from pydantic import BaseModel


class LargePayloadRequest(BaseModel):
    data: str


class LargePayloadResponse(BaseModel):
    byteLength: int


config = {
    "type": "api",
    "name": "LargePayload",
    "description": "Demonstrates how to accept and inspect multi-megabyte payloads.",
    "method": "POST",
    "path": "/api/large-payload",
    "emits": [],
    "flows": ["basic-tutorial"],
    "bodySchema": LargePayloadRequest.model_json_schema(),
    "responseSchema": {
        200: LargePayloadResponse.model_json_schema(),
    },
}


async def handler(req, context):
    data = req.get("body", {}).get("data", "")

    if isinstance(data, bytes):
        payload = data.decode("utf-8")
    elif isinstance(data, str):
        payload = data
    else:
        payload = str(data)

    byte_length = len(payload.encode("utf-8"))
    context.logger.info("Processed large payload", {"byteLength": byte_length})

    return {
        "status": 200,
        "body": {"byteLength": byte_length},
    }
`
      safeWriteFile(pythonStepPath, pythonStep)
      writeFeaturesFile(
        `${relativeStepPath}-features.json`,
        `[
  {
    "id": "payload-schema",
    "title": "Request payload schema",
    "description": "Describes the expected request body with Pydantic so Motia can validate incoming calls.",
    "lines": ["1-15"]
  },
  {
    "id": "response-schema",
    "title": "Response payload schema",
    "description": "Captures the response structure that the step returns to callers.",
    "lines": ["18-26"]
  },
  {
    "id": "handler",
    "title": "Handler implementation",
    "description": "Normalises the payload, records its size and returns the byte length for verification.",
    "lines": ["29-47"]
  }
]`,
      )
      registerStepInWorkbench(relativeStepPath)
      return
    }

    const relativeStepPath = 'steps/petstore/large-payload.step.ts'
    const nodeStepPath = path.join(TEST_PROJECT_PATH, relativeStepPath)
    const nodeStep = `import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

const requestSchema = z.object({
  data: z.string(),
})

const responseSchema = z.object({
  byteLength: z.number(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'LargePayload',
  description: 'Demonstrates how to accept and inspect multi-megabyte payloads.',
  flows: ['basic-tutorial'],
  method: 'POST',
  path: '/api/large-payload',
  bodySchema: requestSchema,
  responseSchema: {
    200: responseSchema,
  },
  emits: [],
}

export const handler: Handlers['LargePayload'] = async (req, { logger }) => {
  const payload = typeof req.body?.data === 'string' ? req.body.data : ''
  const byteLength = Buffer.byteLength(payload)

  logger.info('Processed large payload', { byteLength })

  return {
    status: 200,
    body: { byteLength },
  }
}
`
    safeWriteFile(nodeStepPath, nodeStep)
    writeFeaturesFile(
      `${relativeStepPath}-features.json`,
      `[
  {
    "id": "body-schema",
    "title": "Body schema",
    "description": "Defines the expected request payload using Zod so Motia can validate the incoming data.",
    "lines": ["5-8"]
  },
  {
    "id": "response-schema",
    "title": "Response schema",
    "description": "Captures the metadata returned to the caller for documentation and type generation.",
    "lines": ["10-13"]
  },
  {
    "id": "handler",
    "title": "Handler implementation",
    "description": "Measures the payload size, logs it for observability, and returns the byte length.",
    "lines": ["22-34"]
  }
]`,
    )
    registerStepInWorkbench(relativeStepPath)
  } catch (error) {
    console.error('[LargePayload][Setup] Unexpected error while injecting large payload step', error)
  }
}

function ensureDir(dirPath: string) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
    console.log(`[LargePayload][Setup] created directory ${dirPath}`)
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

function writeFeaturesFile(relativePath: string, contents: string) {
  const targetPath = path.join(TEST_PROJECT_PATH, relativePath)
  safeWriteFile(targetPath, contents)
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
      basicFlow.config[stepPath] = {
        x: 420,
        y: 320,
        sourceHandlePosition: 'right',
        targetHandlePosition: 'left',
      }
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
