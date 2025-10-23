import fs from 'fs'
import path from 'path'
import type { StateStreamEvent, StateStreamEventChannel, StreamConfig } from '../types-stream'
import { Logger } from './logger'
import { composeMiddleware } from './middleware-compose'
import { RpcSender } from './rpc'
import { RpcStateManager } from './rpc-state-manager'

require('dotenv').config()

// Add ts-node registration before dynamic imports

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

function parseArgs(arg?: string) {
  if (!arg) return { data: null }

  const { O_RDONLY, O_NOFOLLOW } = fs.constants
  let fd: number | undefined

  try {
    // Open atomically; O_NOFOLLOW (if available) defends against symlink tricks
    const flags = (O_NOFOLLOW ?? 0) | O_RDONLY
    fd = fs.openSync(arg, flags)

    const st = fs.fstatSync(fd)
    if (!st.isFile()) throw new Error('Not a regular file')

    const text = fs.readFileSync(fd, 'utf8')
    try {
      return JSON.parse(text)
    } catch {
      // Keep legacy fallback (treat file contents as raw data)
      return { data: text }
    }
  } catch (e: any) {
    // If open failed because it's not a file path, try inline JSON
    if (e?.code === 'ENOENT' || e?.code === 'ENOTDIR' || e?.code === 'EISDIR' || e?.message === 'Not a regular file') {
      try {
        return JSON.parse(arg)
      } catch {
        return { data: arg }
      }
    }
    // Unexpected I/O error: surface it (better diagnostics than silent fallback)
    throw e
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd)
      } catch (closeError) {
        console.warn(`parseArgs: failed to close file descriptor for ${arg ?? '<inline JSON>'}`, closeError)
      }
    }
  }
}

async function runTypescriptModule(filePath: string, event: Record<string, unknown>) {
  const sender = new RpcSender(process)

  try {
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

    const middlewares = Array.isArray(module.config?.middleware) ? module.config.middleware : []

    const composedMiddleware = composeMiddleware(...middlewares)
    const handlerFn = () => {
      return contextInFirstArg ? module.handler(context) : module.handler(event.data, context)
    }

    const result = await composedMiddleware(event.data, context, handlerFn)

    await sender.send('result', result)
    await sender.close()

    process.exit(0)
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
