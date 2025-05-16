import { spawn } from 'child_process'
import path from 'path'
import { BaseLogger, Logger } from './logger'
import { Printer } from './printer'
import { RpcProcessor } from './step-handler-rpc-processor'
import { StateStreamFactory } from './state-stream'
import { EmitData, EventManager, InternalStateManager, Step } from './types'
import { isAllowedToEmit } from './utils'

type StateGetInput = { traceId: string; key: string }
type StateSetInput = { traceId: string; key: string; value: unknown }
type StateDeleteInput = { traceId: string; key: string }
type StateClearInput = { traceId: string }

type StateStreamGetInput = { id: string }
type StateStreamMutateInput = { id: string; data: unknown }

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
  streamsConfig: Record<string, StateStreamFactory<any>>
  printer: Printer
  data?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  contextInFirstArg: boolean // if true, the step file will only receive the context object
}

export const callStepFile = <TData>(options: CallStepFileOptions): Promise<TData | undefined> => {
  const { step, printer, eventManager, state, traceId, data, contextInFirstArg, streamsConfig } = options
  const logger = options.logger.child({ step: step.config.name }) as Logger
  const flows = step.config.flows

  return new Promise((resolve, reject) => {
    const streams = Object.keys(streamsConfig).map((name) => ({ name }))
    const jsonData = JSON.stringify({ data, flows, traceId, contextInFirstArg, streams })
    const { runner, command, args } = getLanguageBasedRunner(step.filePath)
    let result: TData | undefined

    const child = spawn(command, [...args, runner, step.filePath, jsonData], {
      stdio: [undefined, undefined, undefined, 'ipc'],
    })

    const emit = async (input: EmitData) => {
      if (!isAllowedToEmit(step, input.topic)) {
        return printer.printInvalidEmit(step, input.topic)
      }

      return eventManager.emit({ ...input, traceId, flows: step.config.flows, logger }, step.filePath)
    }

    const rpcProcessor = new RpcProcessor(child)

    Object.entries(streamsConfig).forEach(([name, streamFactory]) => {
      const stateStream = streamFactory(state)
      rpcProcessor.handler<StateStreamGetInput>(`streams.${name}.get`, (input) => stateStream.get(input.id))
      rpcProcessor.handler<StateStreamMutateInput>(`streams.${name}.update`, (input) =>
        stateStream.update(input.id, input.data),
      )
      rpcProcessor.handler<StateStreamGetInput>(`streams.${name}.delete`, (input) => stateStream.delete(input.id))
      rpcProcessor.handler<StateStreamMutateInput>(`streams.${name}.create`, (input) =>
        stateStream.create(input.id, input.data),
      )
    })

    rpcProcessor.handler<StateGetInput>('close', async () => child.kill())
    rpcProcessor.handler<StateGetInput>('log', async (input: unknown) => logger.log(input))
    rpcProcessor.handler<StateGetInput>('state.get', (input) => state.get(input.traceId, input.key))
    rpcProcessor.handler<StateSetInput>('state.set', (input) => state.set(input.traceId, input.key, input.value))
    rpcProcessor.handler<StateDeleteInput>('state.delete', (input) => state.delete(input.traceId, input.key))
    rpcProcessor.handler<StateClearInput>('state.clear', (input) => state.clear(input.traceId))
    rpcProcessor.handler<TData>('result', async (input) => {
      result = input
    })
    rpcProcessor.handler<EmitData>('emit', emit)

    rpcProcessor.init()

    child.stdout?.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString())
        logger.log(message)
      } catch {
        logger.info(Buffer.from(data).toString())
      }
    })

    child.stderr?.on('data', (data) => logger.error(Buffer.from(data).toString()))

    child.on('close', (code) => {
      if (code !== 0 && code !== null) {
        reject(`Process exited with code ${code}`)
      } else {
        resolve(result)
      }
    })

    child.on('error', (error: { code?: string }) => {
      if (error.code === 'ENOENT') {
        reject(`Executable ${command} not found`)
      } else {
        reject(error)
      }
    })
  })
}
