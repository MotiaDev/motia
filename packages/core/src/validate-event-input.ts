import Ajv, { type ErrorObject } from 'ajv'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { globalLogger } from './logger'
import type { Event, EventConfig, Step } from './types'

const ajv = new Ajv({ allErrors: true, strict: false })

export const validateEventInput = (step: Step<EventConfig>, event: Event, motia: any) => {
  const { data } = event
  const logger = event.logger.child({ step: step.config.name })

  // ✅ 1. Only run if an input schema exists
  if (step.config.input) {
    // ✅ 2. Ensure data is an object before validating
    if (data === null || typeof data !== 'object') {
      logger.warn(`⚠️ Event "${step.config.name}" received non-object data`, { data })
      return
    }

    // ✅ 3. Convert Zod schema to JSON Schema if necessary
    let compiledSchema: any
    const inputSchema = step.config.input

    try {
      if (inputSchema && typeof inputSchema === 'object' && 'safeParse' in inputSchema) {
        // It's a Zod schema → convert to JSON Schema
        compiledSchema = zodToJsonSchema(inputSchema, { target: 'jsonSchema7' })
      } else {
        // Already a JSON Schema
        compiledSchema = inputSchema
      }
    } catch (err) {
      logger.error(`❌ Failed to convert or compile schema for step "${step.config.name}"`, { error: err })
      globalLogger.error('[step handler] failed to convert schema', { step: step.config.name, error: err })
      return
    }

    // ✅ 4. Compile and validate with AJV
    let validate
    try {
      validate = ajv.compile(compiledSchema)
    } catch (err) {
      logger.error(`❌ Invalid JSON schema for step "${step.config.name}"`, { error: err })
      globalLogger.error('[step handler] invalid JSON schema', { step: step.config.name, error: err })
      return
    }

    const valid = validate(data)

    // ✅ 5. Collect and print errors
    if (!valid && validate.errors?.length) {
      const missingFields: string[] = []
      const extraFields: string[] = []
      const typeMismatches: string[] = []

      for (const err of validate.errors as ErrorObject[]) {
        const field = err.instancePath ? err.instancePath.replace(/^\//, '').replace(/\//g, '.') : '(root)'

        switch (err.keyword) {
          case 'required':
            if ('missingProperty' in err.params) {
              missingFields.push(
                field === '(root)' ? err.params.missingProperty : `${field}.${err.params.missingProperty}`,
              )
            }
            break
          case 'type':
            typeMismatches.push(`Field "${field}": must be ${err.params.type}`)
            break
          case 'additionalProperties':
            if ('additionalProperty' in err.params) {
              extraFields.push(
                field === '(root)' ? err.params.additionalProperty : `${field}.${err.params.additionalProperty}`,
              )
            }
            break
          default:
            typeMismatches.push(`Field "${field}": ${err.message}`)
        }
      }

      // ✅ 6. Report validation details
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
  }
}
