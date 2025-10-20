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

    // Validate infrastructure config if present
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
    const handlers: Array<{ topic: string; handler: (event: Event) => Promise<void> }> = []

    subscribes.forEach((subscribe) => {
      const handler = async (event: Event) => {
        let { data, traceId } = event
        const logger = event.logger.child({ step: step.config.name })
        const tracer = event.tracer.child(step, logger)

        globalLogger.debug('[step handler] received event', { event: removeLogger(event), step: name })

        /**
         * ✅ Simplified JSON schema-like validation (no dependencies, TS safe)
         */
        function validateEventData(
          data: Record<string, any>,
          inputSchema: any,
        ): {
          valid: boolean
          missingFields: string[]
          extraFields: string[]
          typeMismatches: string[]
        } {
          if (typeof data !== 'object' || data === null) {
            return {
              valid: false,
              missingFields: [],
              extraFields: [],
              typeMismatches: ['data is not an object'],
            }
          }

          const schemaProps = inputSchema.properties ?? {}
          const required = inputSchema.required ?? []
          const missingFields: string[] = []
          const extraFields: string[] = []
          const typeMismatches: string[] = []

          // Missing required fields
          for (const field of required) {
            if (!(field in data)) missingFields.push(field)
          }

          // Extra fields not in schema
          for (const field of Object.keys(data)) {
            if (!(field in schemaProps)) extraFields.push(field)
          }

          // Type mismatches
          for (const [field, defRaw] of Object.entries(schemaProps)) {
            const def = defRaw as { type?: string }
            if (field in data && def.type) {
              const expected = def.type
              const actual = Array.isArray(data[field]) ? 'array' : typeof data[field]
              if (expected !== actual) {
                typeMismatches.push(`"${field}": expected ${expected}, got ${actual}`)
              }
            }
          }

          const valid = !missingFields.length && !extraFields.length && !typeMismatches.length
          return { valid, missingFields, extraFields, typeMismatches }
        }

        if (step.config.input) {
          if (typeof data === 'object' && data !== null) {
            const { valid, missingFields, extraFields, typeMismatches } = validateEventData(
              data as Record<string, any>,
              step.config.input,
            )

            if (!valid) {
              motia.printer.printEventInputValidationError(
                { topic: event.topic },
                { missingFields, extraFields, typeMismatches },
              )

              logger.warn(`⚠️ Validation warning for event "${step.config.name}"`, {
                missingFields,
                extraFields,
                typeMismatches,
              })
              globalLogger.warn('[step handler] event data validation warning', {
                step: step.config.name,
                missingFields,
                extraFields,
                typeMismatches,
              })
            }
          } else {
            logger.warn(`⚠️ Event "${step.config.name}" received non-object data`, { data })
          }
        }

        // Continue execution even if validation failed
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
