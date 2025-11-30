import path from 'node:path'

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
  const module = await import(path.resolve(filePath))

  const config = module.config || module.default?.config

  if (!config) {
    throw new Error(`Config not found in module ${filePath}`)
  }

  const canAccess = config.canAccess

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
  console.error('Usage: node can-access.mjs <file-path> <payload>')
  process.exit(1)
}

runCanAccess(filePath, parsePayload(payloadArg))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error evaluating canAccess:', error)
    process.exit(1)
  })
