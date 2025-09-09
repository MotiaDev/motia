import { callStepFile } from './call-step-file'
import { globalLogger } from './logger'
import type { Motia } from './motia'
import type { Event, EventConfig, Step } from './types'

export type MotiaEventManager = {
  createHandler: (step: Step<EventConfig>) => void
  removeHandler: (step: Step<EventConfig>) => void
}

export const createStepHandlers = (motia: Motia): MotiaEventManager => {
  const eventSteps = motia.lockedData.eventSteps()

  globalLogger.debug(`[step handler] creating step handlers for ${eventSteps.length} steps`)

  const removeLogger = (event: Event) => {
    // biome-ignore lint/correctness/noUnusedVariables: migration
    const { logger, tracer, ...rest } = event
    return rest
  }

  const createHandler = (step: Step<EventConfig>) => {
    const { config, filePath } = step
    const { subscribes, name } = config

    globalLogger.debug('[step handler] establishing step subscriptions', {
      filePath,
      step: step.config.name,
    })

    subscribes.forEach((subscribe) => {
      motia.eventManager.subscribe({
        filePath,
        event: subscribe,
        handlerName: step.config.name,
        handler: async (event) => {
          const { data, traceId } = event
          const logger = event.logger.child({ step: step.config.name })
          const tracer = event.tracer.child(step, logger)

          globalLogger.debug('[step handler] received event', {
            event: removeLogger(event),
            step: name,
          })

          try {
            await callStepFile({ step, data, traceId, tracer, logger }, motia)

            /* biome-ignore lint/suspicious/noExplicitAny: migration */
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
      motia.eventManager.unsubscribe({ filePath, event: subscribe })
    })
  }

  eventSteps.forEach(createHandler)

  return { removeHandler, createHandler }
}
