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

      globalLogger.debug('[step handler] infrastructure config validated successfully', {
        step: name,
      })
    }

    const queueConfig = getQueueConfigWithDefaults(config.infrastructure)

    const handlers: Array<{ topic: string; handler: (event: Event) => Promise<void> }> = []

    subscribes.forEach((subscribe) => {
      motia.eventManager.subscribe({
        filePath,
        event: subscribe,
        handlerName: step.config.name,
        handler: async (event) => {
          let { data, traceId } = event
          const logger = event.logger.child({ step: step.config.name })
          const tracer = event.tracer.child(step, logger)
          globalLogger.debug('[step handler] received event', { event: removeLogger(event), step: name })

          /**
           * ✅ Simple runtime validator — no Zod needed.
           * Matches the event data object with config.input.properties
           */
          function validateEventData(data: Record<string, any>, inputSchema: any) {
            const missingFields: string[] = []
            const extraFields: string[] = []
            const typeMismatches: string[] = []

            // 1️⃣ Expected schema properties
            const schemaProps = inputSchema.properties ?? {}
            const requiredFields: string[] = inputSchema.required ?? []

            // 2️⃣ Check for missing required fields
            for (const field of requiredFields) {
              if (!(field in data)) missingFields.push(field)
            }

            // 3️⃣ Check for extra fields not defined in schema
            for (const field of Object.keys(data)) {
              if (!(field in schemaProps)) extraFields.push(field)
            }

            // 4️⃣ Check for type mismatches
            for (const [field, def] of Object.entries(schemaProps as Record<string, any>)) {
              if (field in data) {
                const expectedType = (def as any)?.type
                const actualType = Array.isArray((data as any)[field]) ? 'array' : typeof (data as any)[field]

                if (expectedType && expectedType !== actualType) {
                  typeMismatches.push(`"${field}": expected ${expectedType}, got ${actualType}`)
                }
              }
            }

            return { missingFields, extraFields, typeMismatches }
          }

          // ✅ Runtime validation block
          if (step.config.input) {
            if (typeof data !== 'object' || data === null) {
              logger.error(`❌ Validation failed for event "${step.config.name}": data is not an object`)
              return
            }

            const { missingFields, extraFields, typeMismatches } = validateEventData(
              data as Record<string, any>,
              step.config.input,
            )

            if (missingFields.length || extraFields.length || typeMismatches.length) {
              motia.printer.printEventInputValidationError(
                { topic: event.topic },
                { missingFields, extraFields, typeMismatches },
              )

              logger.error(`❌ Validation failed for event "${step.config.name}"`)
              return // stop execution if invalid
            }
          }

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
