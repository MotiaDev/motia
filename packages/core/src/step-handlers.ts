import { callStepFile } from './call-step-file'
import { getQueueConfigWithDefaults } from './infrastructure-validator/defaults'
import { validateInfrastructureConfig } from './infrastructure-validator/validations'
import { globalLogger } from './logger'
import type { Motia } from './motia'
import type { QueueManager } from './queue-manager'
import type { Event, EventConfig, Step } from './types'

export type MotiaEventManager = {
  createHandler: (step: Step<EventConfig>) => void
  removeHandler: (step: Step<EventConfig>) => void
}

export const createStepHandlers = (motia: Motia, queueManager: QueueManager): MotiaEventManager => {
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

    if (config.infrastructure) {
      globalLogger.debug('[step handler] validating infrastructure config', {
        step: name,
        hasInputSchema: !!config.input,
        infrastructure: config.infrastructure,
      })

      const validationResult = validateInfrastructureConfig(config.infrastructure, config.input)

      if (!validationResult.success && validationResult.errors) {
        globalLogger.error('[step handler] Infrastructure configuration validation failed', {
          step: name,
          filePath,
          errors: validationResult.errors,
        })
        return
      }

      globalLogger.debug('[step handler] infrastructure config validated successfully', {
        step: name,
      })
    }

    const queueConfig = getQueueConfigWithDefaults(config.infrastructure)

    const handlers: Array<{ topic: string; handler: (event: Event) => Promise<void> }> = []

    subscribes.forEach((subscribe) => {
      const handler = async (event: Event) => {
        const { data, traceId } = event
        const logger = event.logger.child({ step: step.config.name })
        const tracer = event.tracer.child(step, logger)

        globalLogger.debug('[step handler] received event', { event: removeLogger(event), step: name })

        await callStepFile({ step, data, traceId, tracer, logger, infrastructure: config.infrastructure }, motia)
      }

      queueManager.subscribe(subscribe, handler, queueConfig, subscribe)
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
