import { callStepFile } from './call-step-file'
import { globalLogger } from './logger'
import { Motia } from './motia'
import { Event, Step, EventTrigger } from './types'
import { hasEventTrigger, getTriggersByType } from './guards'

export type MotiaEventManager = {
  createHandler: (step: Step) => void
  removeHandler: (step: Step) => void
}

export const createStepHandlers = (motia: Motia): MotiaEventManager => {
  const eventSteps = motia.lockedData.stepsWithEventTriggers()

  globalLogger.debug(`[step handler] creating step handlers for ${eventSteps.length} steps`)

  const removeLogger = (event: Event) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { logger, tracer, ...rest } = event
    return rest
  }

  const createHandler = (step: Step) => {
    if (!hasEventTrigger(step)) {
      return // No event triggers, nothing to do
    }

    const { config, filePath } = step
    const { name } = config
    const eventTriggers = getTriggersByType(step, 'event')

    globalLogger.debug('[step handler] establishing step subscriptions', { filePath, step: step.config.name })

    eventTriggers.forEach((eventTrigger: EventTrigger) => {
      const { topic } = eventTrigger
      
      motia.eventManager.subscribe({
        filePath,
        event: topic,
        handlerName: step.config.name,
        handler: async (event) => {
          const { data, traceId } = event
          const logger = event.logger.child({ step: step.config.name })
          const tracer = event.tracer.child(step, logger)

          globalLogger.debug('[step handler] received event', { event: removeLogger(event), step: name })

          try {
            await callStepFile({ step, data, traceId, tracer, logger }, motia)

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            const message = typeof error === 'string' ? error : error.message
            logger.error(message)
          }
        },
      })
    })
  }

  const removeHandler = (step: Step) => {
    if (!hasEventTrigger(step)) {
      return // No event triggers, nothing to do
    }

    const { filePath } = step
    const eventTriggers = getTriggersByType(step, 'event')

    eventTriggers.forEach((eventTrigger: EventTrigger) => {
      const { topic } = eventTrigger
      motia.eventManager.unsubscribe({ filePath, event: topic })
    })
  }

  eventSteps.forEach(createHandler)

  return { removeHandler, createHandler }
}
