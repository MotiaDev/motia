import { Event, EventConfig, EventManager, Step } from './types'
import { globalLogger } from './logger'
import { callStepFile } from './call-step-file'
import { LockedData } from './locked-data'
import { StateAdapter } from './state/state-adapter'
import { MotiaError, createErrorContext, ErrorCategory } from './errors'

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
              contextInFirstArg: false,
              step,
              printer,
              eventManager,
              state,
              data,
              traceId,
              logger,
            })
          } catch (error: unknown) {
            const errorContext = createErrorContext(step, traceId, data, error as Error)
            const motiaError = new MotiaError(
              error instanceof Error ? error.message : String(error),
              errorContext.category,
              errorContext,
            )

            logger.error('[step handler] error executing step', {
              error: motiaError.message,
              category: motiaError.category,
              context: errorContext,
              step: name,
            })

            // For network errors, we could implement retry logic here
            if (errorContext.category === ErrorCategory.NETWORK) {
              logger.info('[step handler] network error detected, consider implementing retry logic', {
                step: name,
                traceId,
              })
            }
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
