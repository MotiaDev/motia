import { callStepFile } from './call-step-file'
import { globalLogger } from './logger'
import { Motia } from './motia'
import { Event, EventConfig, Step } from './types'
import { getQueueConfigWithDefaults } from './infrastructure-validator/defaults'
import { queueManager } from './queue-manager'

export type MotiaEventManager = {
  createHandler: (step: Step<EventConfig>) => void
  removeHandler: (step: Step<EventConfig>) => void
}

export const createStepHandlers = (motia: Motia): MotiaEventManager => {
  const eventSteps = motia.lockedData.eventSteps()
  const handlerMap = new Map<string, Array<{ topic: string; handler: (event: Event) => Promise<void> }>>()

  globalLogger.debug(`[step handler] creating step handlers for ${eventSteps.length} steps`)

  const removeLogger = (event: Event) => {
    const { logger, tracer, ...rest } = event
    return rest
  }

  const createHandler = (step: Step<EventConfig>) => {
    const { config, filePath } = step
    const { subscribes, name } = config

    globalLogger.debug('[step handler] establishing step subscriptions', { filePath, step: step.config.name })

    const queueConfig = getQueueConfigWithDefaults(config.infrastructure)

    const handlers: Array<{ topic: string; handler: (event: Event) => Promise<void> }> = []

    subscribes.forEach((subscribe) => {
      const handler = async (event: Event) => {
        const { data, traceId } = event
        const logger = event.logger.child({ step: step.config.name })
        const tracer = event.tracer.child(step, logger)

        globalLogger.debug('[step handler] received event', { event: removeLogger(event), step: name })

        await callStepFile({ step, data, traceId, tracer, logger }, motia)
      }

      queueManager.subscribe(subscribe, handler, queueConfig)
      handlers.push({ topic: subscribe, handler })
    })

    handlerMap.set(filePath, handlers)
  }

  const removeHandler = (step: Step<EventConfig>) => {
    const { filePath } = step
    const handlers = handlerMap.get(filePath)

    if (handlers) {
      handlers.forEach(({ topic, handler }) => {
        queueManager.unsubscribe(topic, handler)
        globalLogger.debug('[step handler] unsubscribed handler', { filePath, topic, step: step.config.name })
      })
      handlerMap.delete(filePath)
    }
  }

  eventSteps.forEach(createHandler)

  return { removeHandler, createHandler }
}
