import { execSync } from 'child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs'
import path from 'path'

const CONFIG_TEMPLATE = `import { config } from '@motiadev/core'
import { BullMQEventAdapter } from '@motiadev/adapter-bullmq-events'
const statesPlugin = require('@motiadev/plugin-states/plugin')
const endpointPlugin = require('@motiadev/plugin-endpoint/plugin')
const logsPlugin = require('@motiadev/plugin-logs/plugin')
const observabilityPlugin = require('@motiadev/plugin-observability/plugin')
const bullmqPlugin = require('@motiadev/plugin-bullmq/plugin')

const redisHost = process.env.REDIS_HOST || '127.0.0.1'
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10)
const redisPassword = process.env.REDIS_PASSWORD
const bullmqPrefix = process.env.BULLMQ_PREFIX || 'motia:e2e'
const dlqSuffix = process.env.BULLMQ_DLQ_SUFFIX || '.dlq'

const connection = {
  host: redisHost,
  port: redisPort,
  ...(redisPassword ? { password: redisPassword } : {}),
}

export default config({
  plugins: [observabilityPlugin, statesPlugin, endpointPlugin, logsPlugin, bullmqPlugin],
})
`

const copyDirectory = (source: string, destination: string) => {
  if (!existsSync(source)) {
    throw new Error(`Missing BullMQ assets at ${source}`)
  }

  if (existsSync(destination)) {
    rmSync(destination, { recursive: true, force: true })
  }

  mkdirSync(destination, { recursive: true })

  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const srcPath = path.join(source, entry.name)
    const destPath = path.join(destination, entry.name)

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath)
    } else if (entry.isFile()) {
      cpSync(srcPath, destPath)
    }
  }
}

type ConfigureOptions = {
  projectPath: string
  workspaceRoot: string
}

export const configureBullMQProject = ({ projectPath, workspaceRoot }: ConfigureOptions) => {
  const assetsRoot = path.join(workspaceRoot, 'packages', 'e2e', 'assets', 'bullmq', 'steps', 'bullmq-tests')
  const targetSteps = path.join(projectPath, 'steps', 'bullmq-tests')
  copyDirectory(assetsRoot, targetSteps)

  if (!process.env.BULLMQ_PREFIX) {
    process.env.BULLMQ_PREFIX = `motia`
  }

  return { prefix: process.env.BULLMQ_PREFIX }
}

// export const cleanupBullMQKeys = (prefix?: string) => {
//   const redisHost = process.env.REDIS_HOST || '127.0.0.1'
//   const redisPort = process.env.REDIS_PORT || '6379'
//   if (!prefix) {
//     return
//   }

//   try {
//     const scanOutput = execSync(
//       `redis-cli -h ${redisHost} -p ${redisPort} --scan --pattern "${prefix}:*"`,
//       { encoding: 'utf8' },
//     )
//     const keys = scanOutput
//       .split('\n')
//       .map((value) => value.trim())
//       .filter(Boolean)

//     if (keys.length === 0) {
//       return
//     }

//     execSync(`redis-cli -h ${redisHost} -p ${redisPort} del ${keys.join(' ')}`, { stdio: 'pipe' })
//     console.log(`🧼 Cleaned ${keys.length} BullMQ keys for prefix ${prefix}`)
//   } catch (error) {
//     console.warn(`⚠️ Failed to clean BullMQ keys for prefix ${prefix}`, error)
//   }
// }
