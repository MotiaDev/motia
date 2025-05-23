import { Event, EventManager, InternalStateManager, Step } from './types'
import path from 'path'
import { LockedData } from './locked-data'
import { BaseLogger, Logger } from './logger'
import { Printer } from './printer'
import { isAllowedToEmit } from './utils'
import { BaseStreamItem } from './types-stream'
import { ProcessManager } from './process-communication/process-manager'

type StateGetInput = { traceId: string; key: string }
type StateSetInput = { traceId: string; key: string; value: unknown }
type StateDeleteInput = { traceId: string; key: string }
type StateClearInput = { traceId: string }

type StateStreamGetInput = { id: string }
type StateStreamMutateInput = { id: string; data: BaseStreamItem }

const getLanguageBasedRunner = (
  stepFilePath = '',
): {
  command: string
  runner: string
  args: string[]
} => {
  const isPython = stepFilePath.endsWith('.py')
  const isRuby = stepFilePath.endsWith('.rb')
  const isNode = stepFilePath.endsWith('.js') || stepFilePath.endsWith('.ts')

  if (isPython) {
    const pythonRunner = path.join(__dirname, 'python', 'python-runner.py')
    return { runner: pythonRunner, command: 'python', args: [] }
  } else if (isRuby) {
    const rubyRunner = path.join(__dirname, 'ruby', 'ruby-runner.rb')
    return { runner: rubyRunner, command: 'ruby', args: [] }
  } else if (isNode) {
    if (process.env._MOTIA_TEST_MODE === 'true') {
      const nodeRunner = path.join(__dirname, 'node', 'node-runner.ts')
      return { runner: nodeRunner, command: 'node', args: ['-r', 'ts-node/register'] }
    }

    const nodeRunner = path.join(__dirname, 'node', 'node-runner.js')
    return { runner: nodeRunner, command: 'node', args: [] }
  }

  throw Error(`Unsupported file extension ${stepFilePath}`)
}

type CallStepFileOptions = {
  step: Step
  logger: BaseLogger
  eventManager: EventManager
  state: InternalStateManager
  traceId: string
  lockedData: LockedData
  printer: Printer
  data?: any
  contextInFirstArg: boolean
}

export const callStepFile = <TData>(options: CallStepFileOptions): Promise<TData | undefined> => {
  const { step, printer, eventManager, state, traceId, data, contextInFirstArg, lockedData } = options
  const logger = options.logger.child({ step: step.config.name }) as Logger
  const flows = step.config.flows

  return new Promise((resolve, reject) => {
    const streamConfig = lockedData.getStreams()
    const streams = Object.keys(streamConfig).map((name) => ({ name }))
    const jsonData = JSON.stringify({ data, flows, traceId, contextInFirstArg, streams })
    const { runner, command, args } = getLanguageBasedRunner(step.filePath)
    let result: TData | undefined

    // Create process manager with unified communication handling
    const processManager = new ProcessManager({
      command,
      args: [...args, runner, step.filePath, jsonData],
      logger,
      context: 'StepExecution'
    })

    processManager.spawn().then(() => {
      // Register all step handlers
      processManager.handler<StateGetInput>('close', async () => processManager.kill())
      processManager.handler<unknown>('log', async (input: unknown) => logger.log(input))
      processManager.handler<StateGetInput, unknown>('state.get', (input) => state.get(input.traceId, input.key))
      processManager.handler<StateSetInput, void>('state.set', (input) => state.set(input.traceId, input.key, input.value))
      processManager.handler<StateDeleteInput, void>('state.delete', (input) => state.delete(input.traceId, input.key))
      processManager.handler<StateClearInput, void>('state.clear', (input) => state.clear(input.traceId))
      processManager.handler<TData, void>('result', async (input) => {
        result = input
      })
      processManager.handler<Event, unknown>('emit', async (input) => {
        if (!isAllowedToEmit(step, input.topic)) {
          return printer.printInvalidEmit(step, input.topic)
        }

        return eventManager.emit({ ...input, traceId, flows: step.config.flows, logger }, step.filePath)
      })

      Object.entries(streamConfig).forEach(([name, streamFactory]) => {
        const stateStream = streamFactory()

        processManager.handler<StateStreamGetInput>(`streams.${name}.get`, (input) => stateStream.get(input.id))
        processManager.handler<StateStreamMutateInput>(`streams.${name}.update`, (input) =>
          stateStream.update(input.id, input.data),
        )
        processManager.handler<StateStreamGetInput>(`streams.${name}.delete`, (input) => stateStream.delete(input.id))
        processManager.handler<StateStreamMutateInput>(`streams.${name}.create`, (input) =>
          stateStream.create(input.id, input.data),
        )
      })

      // Handle stdout for non-RPC mode (logging)
      processManager.onStdout((data) => {
        try {
          const message = JSON.parse(data.toString())
          logger.log(message)
        } catch {
          logger.info(Buffer.from(data).toString())
        }
      })

      // Handle stderr
      processManager.onStderr((data) => logger.error(Buffer.from(data).toString()))

      // Handle process close
      processManager.onProcessClose((code) => {
        processManager.close()
        if (code !== 0 && code !== null) {
          reject(`Process exited with code ${code}`)
        } else {
          resolve(result)
        }
      })

      // Handle process errors
      processManager.onProcessError((error) => {
        processManager.close()
        if (error.code === 'ENOENT') {
          reject(`Executable ${command} not found`)
        } else {
          reject(error)
        }
      })

    }).catch((error) => {
      reject(`Failed to spawn process: ${error}`)
    })
  })
}
