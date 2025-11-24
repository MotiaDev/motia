import { trackEvent } from './analytics/utils'
import { getLanguageBasedRunner } from './language-runner'
import type { Logger } from './logger'
import type { Motia } from './motia'
import type { Tracer } from './observability'
import type { TraceError } from './observability/types'
import { ProcessManager } from './process-communication/process-manager'
import type { Event, InfrastructureConfig, Step } from './types'
import type { BaseStreamItem, StateStreamEvent, StateStreamEventChannel } from './types-stream'
import { isAllowedToEmit } from './utils'

type StateGetInput = { traceId: string; key: string }
type StateSetInput = { traceId: string; key: string; value: unknown }
type StateDeleteInput = { traceId: string; key: string }
type StateClearInput = { traceId: string }

type StateStreamGetInput = { groupId: string; id: string }
type StateStreamSendInput = { channel: StateStreamEventChannel; event: StateStreamEvent<unknown> }
type StateStreamMutateInput = { groupId: string; id: string; data: BaseStreamItem }

type CallStepFileOptions = {
  step: Step
  traceId: string
  data?: unknown
  contextInFirstArg?: boolean
  logger: Logger
  tracer: Tracer
  infrastructure?: Partial<InfrastructureConfig>
}

export const callStepFile = <TData>(options: CallStepFileOptions, motia: Motia): Promise<TData | undefined> => {
  const { step, traceId, data, tracer, logger, contextInFirstArg = false, infrastructure } = options

  const flows = step.config.flows

  return new Promise((resolve, reject) => {
    const streamConfig = motia.lockedData.getStreams()
    const streams = Object.keys(streamConfig).map((name) => ({ name }))
    const jsonData = JSON.stringify({ data, flows, traceId, contextInFirstArg, streams })
    const { runner, command, args } = getLanguageBasedRunner(step.filePath)
    let result: TData | undefined
    let timeoutId: NodeJS.Timeout | undefined

    const processManager = new ProcessManager({
      command,
      args: [...args, runner, step.filePath, jsonData],
      logger,
      context: 'StepExecution',
      projectRoot: motia.lockedData.baseDir,
    })

    trackEvent('step_execution_started', {
      stepName: step.config.name,
      language: command,
      type: step.config.type,
      streams: streams.length,
    })

    const timeoutSeconds = infrastructure?.handler?.timeout
    if (timeoutSeconds) {
      timeoutId = setTimeout(async () => {
        processManager.kill()
        const errorMessage = `Step execution timed out after ${timeoutSeconds} seconds`
        logger.error(errorMessage, { step: step.config.name, timeout: timeoutSeconds })
        await tracer.end({ message: errorMessage })
        trackEvent('step_execution_timeout', {
          stepName: step.config.name,
          traceId,
          timeout: timeoutSeconds,
        })
        reject(new Error(errorMessage))
      }, timeoutSeconds * 1000)
    }

    processManager
      .spawn()
      .then(() => {
        processManager.handler<TraceError | undefined>('close', async (err) => {
          processManager.kill()

          if (err) {
            trackEvent('step_execution_error', {
              stepName: step.config.name,
              traceId,
              message: err.message,
            })

            await tracer.end({
              message: err.message,
              code: err.code,
              stack: err.stack?.replace(new RegExp(`${motia.lockedData.baseDir}/`), ''),
            })

            reject(new Error(err.message || 'Handler execution failed'))
          } else {
            await tracer.end()
          }
        })
        processManager.handler<unknown>('log', async (input: unknown) => logger.log(input))

        processManager.handler<StateGetInput, unknown>('state.get', async (input) => {
          await tracer.stateOperation('get', input)
          return motia.state.get(input.traceId, input.key)
        })

        processManager.handler<StateSetInput, unknown>('state.set', async (input) => {
          await tracer.stateOperation('set', { traceId: input.traceId, key: input.key, value: input.value })
          return motia.state.set(input.traceId, input.key, input.value)
        })

        processManager.handler<StateDeleteInput, unknown>('state.delete', async (input) => {
          await tracer.stateOperation('delete', input)
          return motia.state.delete(input.traceId, input.key)
        })

        processManager.handler<StateClearInput, void>('state.clear', async (input) => {
          await tracer.stateOperation('clear', input)
          return motia.state.clear(input.traceId)
        })

        processManager.handler<StateStreamGetInput>(`state.getGroup`, async (input) => {
          await tracer.stateOperation('getGroup', input)
          return motia.state.getGroup(input.groupId)
        })

        processManager.handler<TData, void>('result', async (input) => {
          const anyInput: any = { ...input }

          if (anyInput.body && anyInput.body.type === 'Buffer') {
            anyInput.body = Buffer.from(anyInput.body.data)
          }
          result = anyInput
        })

        processManager.handler<Event, unknown>('emit', async (input) => {
          const flows = step.config.flows

          if (!isAllowedToEmit(step, input.topic)) {
            await tracer.emitOperation(input.topic, input.data, false)
            return motia.printer.printInvalidEmit(step, input.topic)
          }

          await tracer.emitOperation(input.topic, input.data, true)
          return motia.eventAdapter.emit({ ...input, traceId, flows, logger, tracer })
        })

        Object.entries(streamConfig).forEach(([name, streamFactory]) => {
          const stateStream = streamFactory()

          processManager.handler<StateStreamGetInput>(`streams.${name}.get`, async (input) => {
            await tracer.streamOperation(name, 'get', input)
            return stateStream.get(input.groupId, input.id)
          })

          processManager.handler<StateStreamMutateInput>(`streams.${name}.set`, async (input) => {
            await tracer.streamOperation(name, 'set', { groupId: input.groupId, id: input.id, data: input.data })
            return stateStream.set(input.groupId, input.id, input.data)
          })

          processManager.handler<StateStreamGetInput>(`streams.${name}.delete`, async (input) => {
            await tracer.streamOperation(name, 'delete', input)
            return stateStream.delete(input.groupId, input.id)
          })

          processManager.handler<StateStreamGetInput>(`streams.${name}.getGroup`, async (input) => {
            await tracer.streamOperation(name, 'getGroup', input)
            return stateStream.getGroup(input.groupId)
          })

          processManager.handler<StateStreamSendInput>(`streams.${name}.send`, async (input) => {
            await tracer.streamOperation(name, 'send', input)
            return stateStream.send(input.channel, input.event)
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

        processManager.onProcessClose(async (code) => {
          if (timeoutId) clearTimeout(timeoutId)
          processManager.close()

          if (code !== 0 && code !== null) {
            const error = { message: `Process exited with code ${code}`, code }
            await tracer.end(error)
            trackEvent('step_execution_error', { stepName: step.config.name, traceId, code })
            reject(`Process exited with code ${code}`)
          } else {
            await tracer.end()
            resolve(result)
          }
        })

        processManager.onProcessError(async (error) => {
          if (timeoutId) clearTimeout(timeoutId)
          processManager.close()
          await tracer.end({
            message: error.message,
            code: error.code,
            stack: error.stack,
          })

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
      .catch(async (error) => {
        if (timeoutId) clearTimeout(timeoutId)
        await tracer.end({
          message: error.message,
          code: error.code,
          stack: error.stack,
        })

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
