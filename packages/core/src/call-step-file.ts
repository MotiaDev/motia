import { Event, EventManager, InternalStateManager, Step } from './types'
import path from 'path'
import { LockedData } from './locked-data'
import { BaseLogger } from './logger'
import { Printer } from './printer'
import { isAllowedToEmit } from './utils'
import { BaseStreamItem } from './types-stream'
import { ProcessManager } from './process-communication/process-manager'
import { trackEvent } from './analytics/utils'
import { observabilityService } from './observability/observability-service'

type StateGetInput = { traceId: string; key: string }
type StateSetInput = { traceId: string; key: string; value: unknown }
type StateDeleteInput = { traceId: string; key: string }
type StateClearInput = { traceId: string }

type StateStreamGetInput = { groupId: string; id: string }
type StateStreamMutateInput = { groupId: string; id: string; data: BaseStreamItem }

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
  
  observabilityService.initialize()
  
  const logger = observabilityService.createObservabilityLogger(
    traceId,
    step.config.flows,
    step.config.name,
    options.logger.isVerbose,
    (options.logger as any).logStream
  )
  
  const flows = step.config.flows

  return new Promise((resolve, reject) => {
    const streamConfig = lockedData.getStreams()
    const streams = Object.keys(streamConfig).map((name) => ({ name }))
    const jsonData = JSON.stringify({ data, flows, traceId, contextInFirstArg, streams })
    const { runner, command, args } = getLanguageBasedRunner(step.filePath)
    let result: TData | undefined
    const stepStartTime = Date.now()

    logger.logStepStart(step.config.name)

    const processManager = new ProcessManager({
      command,
      args: [...args, runner, step.filePath, jsonData],
      logger,
      context: 'StepExecution',
    })

    trackEvent('step_execution_started', { language: command, type: step.config.type, streams: streams.length })

    processManager
      .spawn()
      .then(() => {
        processManager.handler<StateGetInput>('close', async () => processManager.kill())
        processManager.handler<unknown>('log', async (input: unknown) => logger.log(input))
        
        processManager.handler<StateGetInput, unknown>('state.get', async (input) => {
          logger.logStateOperation(step.config.name, 'get', input.key)
          return state.get(input.traceId, input.key)
        })
        
        processManager.handler<StateSetInput, unknown>('state.set', async (input) => {
          logger.logStateOperation(step.config.name, 'set', input.key)
          return state.set(input.traceId, input.key, input.value)
        })
        
        processManager.handler<StateDeleteInput, unknown>('state.delete', async (input) => {
          logger.logStateOperation(step.config.name, 'delete', input.key)
          return state.delete(input.traceId, input.key)
        })
        
        processManager.handler<StateClearInput, void>('state.clear', async (input) => {
          logger.logStateOperation(step.config.name, 'clear')
          return state.clear(input.traceId)
        })
        
        processManager.handler<StateStreamGetInput>(`state.getGroup`, (input) => state.getGroup(input.groupId))
        processManager.handler<TData, void>('result', async (input) => {
          result = input
        })
        
        processManager.handler<Event, unknown>('emit', async (input) => {
          if (!isAllowedToEmit(step, input.topic)) {
            logger.logEmitOperation(step.config.name, input.topic, false)
            return printer.printInvalidEmit(step, input.topic)
          }

          logger.logEmitOperation(step.config.name, input.topic, true)
          return eventManager.emit({ ...input, traceId, flows: step.config.flows, logger }, step.filePath)
        })

        Object.entries(streamConfig).forEach(([name, streamFactory]) => {
          const stateStream = streamFactory()

          processManager.handler<StateStreamGetInput>(`streams.${name}.get`, async (input) => {
            logger.logStreamOperation(step.config.name, name, 'get')
            return stateStream.get(input.groupId, input.id)
          })
          
          processManager.handler<StateStreamMutateInput>(`streams.${name}.set`, async (input) => {
            logger.logStreamOperation(step.config.name, name, 'set')
            return stateStream.set(input.groupId, input.id, input.data)
          })
          
          processManager.handler<StateStreamGetInput>(`streams.${name}.delete`, async (input) => {
            logger.logStreamOperation(step.config.name, name, 'delete')
            return stateStream.delete(input.groupId, input.id)
          })
          
          processManager.handler<StateStreamGetInput>(`streams.${name}.getGroup`, async (input) => {
            logger.logStreamOperation(step.config.name, name, 'get')
            return stateStream.getGroup(input.groupId)
          })
        })

        processManager.onStdout((data) => {
          try {
            const message = JSON.parse(data.toString())
            logger.log(message)
          } catch {
            logger.info(Buffer.from(data).toString())
          }
        })

        processManager.onStderr((data) => logger.error(Buffer.from(data).toString()))

        processManager.onProcessClose((code) => {
          processManager.close()
          const duration = Date.now() - stepStartTime
          
          if (code !== 0 && code !== null) {
            const error = { message: `Process exited with code ${code}`, code }
            logger.logStepEnd(step.config.name, duration, false, error)
            trackEvent('step_execution_error', { stepName: step.config.name, traceId, code })
            reject(`Process exited with code ${code}`)
          } else {
            logger.logStepEnd(step.config.name, duration, true)
            resolve(result)
          }
        })

        processManager.onProcessError((error) => {
          processManager.close()
          const duration = Date.now() - stepStartTime
          const errorObj = { message: error.message, code: error.code }
          
          logger.logStepEnd(step.config.name, duration, false, errorObj)
          
          if (error.code === 'ENOENT') {
            trackEvent('step_execution_error', {
              stepName: step.config.name,
              traceId,
              code: error.code,
              message: error.message,
            })
            reject(`Executable ${command} not found`)
          } else {
            reject(error)
          }
        })
      })
      .catch((error) => {
        const duration = Date.now() - stepStartTime
        const errorObj = { message: error.message, code: error.code }
        
        logger.logStepEnd(step.config.name, duration, false, errorObj)
        
        trackEvent('step_execution_error', {
          stepName: step.config.name,
          traceId,
          code: error.code,
          message: error.message,
        })
        reject(`Failed to spawn process: ${error}`)
      })
  })
}
