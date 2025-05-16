import { Event, EventConfig, EventManager, Step } from './types'
import { globalLogger } from './logger'
import { callStepFile } from './call-step-file'
import { LockedData } from './locked-data'
import { StateAdapter } from './state/state-adapter'

export type MotiaEventManager = {
  createHandler: (step: Step<EventConfig>) => void
  removeHandler: (step: Step<EventConfig>) => void
}

export const createStepHandlers = (
  lockedData: LockedData,
  eventManager: EventManager,
  state: StateAdapter,
): MotiaEventManager => {
  const eventSteps = lockedData.eventSteps()
  const printer = lockedData.printer

  globalLogger.debug(`[step handler] creating step handlers for ${eventSteps.length} steps`)

  const removeLogger = (event: Event) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { logger, ...rest } = event
    return rest
  }

  const createHandler = (step: Step<EventConfig>) => {
    const { config, filePath } = step
    const { subscribes, name } = config

    globalLogger.debug('[step handler] establishing step subscriptions', { filePath, step: step.config.name })

    subscribes.forEach((subscribe) => {
      eventManager.subscribe({
        filePath,
        event: subscribe,
        handlerName: step.config.name,
        handler: async (event) => {
          const { logger, data, traceId } = event

          globalLogger.debug('[step handler] received event', { event: removeLogger(event), step: name })

          try {
            await callStepFile({
              streamsConfig: lockedData.getStreams(),
              contextInFirstArg: false,
              step,
              printer,
              eventManager,
              state,
              data,
              traceId,
              logger,
            })

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            const message = typeof error === 'string' ? error : error.message
            logger.error(message)
          }
        },
      })
    })
  }

  const removeHandler = (step: Step<EventConfig>) => {
    const { config, filePath } = step
    const { subscribes } = config

    subscribes.forEach((subscribe) => {
      eventManager.unsubscribe({ filePath, event: subscribe })
    })
  }

  eventSteps.forEach(createHandler)

  return { removeHandler, createHandler }
}
