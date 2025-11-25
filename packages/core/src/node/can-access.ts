import path from 'node:path'

require('dotenv').config()

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

type CanAccessPayload = {
  subscription: { groupId: string; id?: string }
  authContext?: unknown
}

function parsePayload(arg: string): CanAccessPayload {
  try {
    return JSON.parse(arg)
  } catch {
    throw new Error('Invalid payload for canAccess evaluation')
  }
}

async function runCanAccess(filePath: string, payload: CanAccessPayload) {
  const module = require(path.resolve(filePath))

  if (!module?.config) {
    throw new Error(`Config not found in module ${filePath}`)
  }

  const canAccess = module.config.canAccess

  if (typeof canAccess !== 'function') {
    process.send?.(true)
    process.exit(0)
  }

  const result = await canAccess(payload.subscription, payload.authContext)
  process.send?.(Boolean(result))
  process.exit(0)
}

const [, , filePath, payloadArg] = process.argv

if (!filePath || !payloadArg) {
  console.error('Usage: node can-access.js <file-path> <payload>')
  process.exit(1)
}

runCanAccess(filePath, parsePayload(payloadArg))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error evaluating canAccess:', error)
    process.exit(1)
  })
