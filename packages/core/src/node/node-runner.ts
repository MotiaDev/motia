import path from 'path'
import type { StateStreamEvent, StateStreamEventChannel, StreamConfig } from '../types-stream'
import { Logger } from './logger'
import { composeMiddleware } from './middleware-compose'
import { RpcSender } from './rpc'
import { RpcStateManager } from './rpc-state-manager'

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config()

// Add ts-node registration before dynamic imports
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

function parseArgs(arg: string) {
  try {
    return JSON.parse(arg)
  } catch {
    return arg
  }
}

async function runTypescriptModule(filePath: string, event: Record<string, unknown>) {
  const sender = new RpcSender(process)

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require(path.resolve(filePath))

    // Check if the specified function exists in the module
    if (typeof module.handler !== 'function') {
      throw new Error(`Function handler not found in module ${filePath}`)
    }

    const { traceId, flows, contextInFirstArg } = event

    const logger = new Logger(traceId as string, flows as string[], sender)
    const state = new RpcStateManager(sender)

    const emit = async (data: unknown) => sender.send('emit', data)
    const streamsConfig = event.streams as StreamConfig[]
    const streams = (streamsConfig ?? []).reduce(
      (acc, streams) => {
        acc[streams.name] = {
          get: (groupId: string, id: string) => sender.send(`streams.${streams.name}.get`, { groupId, id }),
          set: (groupId: string, id: string, data: unknown) =>
            sender.send(`streams.${streams.name}.set`, { groupId, id, data }),
          delete: (groupId: string, id: string) => sender.send(`streams.${streams.name}.delete`, { groupId, id }),
          getGroup: (groupId: string) => sender.send(`streams.${streams.name}.getGroup`, { groupId }),
          send: (channel: StateStreamEventChannel, event: StateStreamEvent<unknown>) =>
            sender.send(`streams.${streams.name}.send`, { channel, event }),
        }
        return acc
      },
      {} as Record<string, unknown>,
    )

    const context = { traceId, flows, logger, state, emit, streams }

    sender.init()

    const middlewares = Array.isArray(module.config.middleware) ? module.config.middleware : []

    const composedMiddleware = composeMiddleware(...middlewares)
    const handlerFn = () => {
      return contextInFirstArg ? module.handler(context) : module.handler(event.data, context)
    }

    const result = await composedMiddleware(event.data, context, handlerFn)

    await sender.send('result', result)
    await sender.close()

    process.exit(0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    const stack: string[] = err.stack?.split('\n') ?? []

    if (stack) {
      const index = stack.findIndex((line) => line.includes('src/node/node-runner'))
      stack.splice(index, stack.length - index)
      stack.splice(0, 1) // remove first line which has the error message
    }

    const error = {
      message: err.message || '',
      code: err.code || null,
      stack: stack.join('\n'),
    }
    sender.sendNoWait('close', error)
  }
}

const [, , filePath, arg] = process.argv

if (!filePath) {
  console.error('Usage: node nodeRunner.js <file-path> <arg>')
  process.exit(1)
}

runTypescriptModule(filePath, parseArgs(arg)).catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
