import type { EventAdapter, SubscriptionHandle } from './adapters/event-adapter'
import { callStepFile } from './call-step-file'
import { getQueueConfigWithDefaults } from './infrastructure-validator/defaults'
import { validateInfrastructureConfig } from './infrastructure-validator/validations'
import { globalLogger } from './logger'
import type { Motia } from './motia'
import type { Event, EventConfig, Step } from './types'
import { validateEventInput } from './validate-event-input'

export type MotiaEventManager = {
  createHandler: (step: Step<EventConfig>) => void
  removeHandler: (step: Step<EventConfig>) => void
}

export const createStepHandlers = (motia: Motia, eventAdapter: EventAdapter): MotiaEventManager => {
  const eventSteps = motia.lockedData.eventSteps()
  const handlerMap = new Map<string, Array<SubscriptionHandle>>()

  globalLogger.debug(`[step handler] creating step handlers for ${eventSteps.length} steps`)

  const removeLogger = (event: Event) => {
    const { logger, tracer, ...rest } = event
    return rest
  }

  const createHandler = (step: Step<EventConfig>) => {
    const { config, filePath } = step
    const { subscribes, name } = config

    globalLogger.debug('[step handler] establishing step subscriptions', { filePath, step: step.config.name })

    // ✅ Validate infrastructure config if present
    if (config.infrastructure) {
      globalLogger.debug('[step handler] validating infrastructure config', {
        step: name,
        infrastructure: config.infrastructure,
      })

      const validationResult = validateInfrastructureConfig(config.infrastructure)

      if (!validationResult.success && validationResult.errors) {
        globalLogger.error('[step handler] Infrastructure configuration validation failed', {
          step: name,
          filePath,
          errors: validationResult.errors,
        })
        return
      }

      globalLogger.debug('[step handler] infrastructure config validated successfully', { step: name })
    }

    const queueConfig = getQueueConfigWithDefaults(config.infrastructure)
    const handlers: Array<SubscriptionHandle> = []

    subscribes.forEach(async (subscribe) => {
      const handler = async (event: Event) => {
        const { data, traceId, flows } = event

        const logger = event.logger
          ? event.logger.child({ step: step.config.name })
          : motia.loggerFactory.create({ traceId, flows: flows || [], stepName: step.config.name })

        const tracer = event.tracer
          ? event.tracer.child(step, logger)
          : await motia.tracerFactory.createTracer(traceId, step, logger)

        globalLogger.debug('[step handler] received event', { event: removeLogger(event), step: name })

        validateEventInput(step, event, motia)

        // Continue execution even if validation failed
        await callStepFile({ step, data, traceId, tracer, logger, infrastructure: config.infrastructure }, motia)
      }

      const subscriptionHandle = await eventAdapter.subscribe(subscribe, handler, queueConfig)
      handlers.push(subscriptionHandle)
    })

    handlerMap.set(filePath, handlers)
  }

  const removeHandler = (step: Step<EventConfig>) => {
    const { filePath } = step
    const handlers = handlerMap.get(filePath)

    if (handlers) {
      handlers.forEach((subscriptionHandle) => {
        eventAdapter.unsubscribe(subscriptionHandle)
        globalLogger.debug('[step handler] unsubscribed handler', {
          filePath,
          ...subscriptionHandle,
          step: step.config.name,
        })
      })
      handlerMap.delete(filePath)
    }
  }

  eventSteps.forEach(createHandler)

  return { removeHandler, createHandler }
}
