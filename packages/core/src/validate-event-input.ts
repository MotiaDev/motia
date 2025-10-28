import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { globalLogger } from './logger'
import { Printer } from './printer'
import type { Event, EventConfig, Step } from './types'

const ajv = new Ajv({ allErrors: true, strict: false })

export const validateEventInput = (step: Step<EventConfig>, event: Event, motia: any) => {
  const { data } = event
  const logger = event.logger
    ? event.logger.child({ step: step.config.name })
    : motia.loggerFactory.create({ step: step.config.name, traceId: event.traceId })

  if (step.config.input) {
    if (data === null || typeof data !== 'object') {
      logger.warn(`⚠️ Event "${step.config.name}" received non-object data`, { data })
      return
    }

    let compiledSchema: any
    const inputSchema = step.config.input

    try {
      if (inputSchema && typeof inputSchema === 'object' && 'safeParse' in inputSchema) {
        compiledSchema = zodToJsonSchema(inputSchema, { target: 'jsonSchema7' })
      } else {
        compiledSchema = inputSchema
      }
    } catch (err) {
      logger.error(`❌ Failed to convert or compile schema for step "${step.config.name}"`, { error: err })
      globalLogger.error('[step handler] failed to convert schema', { step: step.config.name, error: err })
      return
    }

    let validate: ValidateFunction
    try {
      validate = ajv.compile(compiledSchema)
    } catch (err) {
      logger.error(`❌ Invalid JSON schema for step "${step.config.name}"`, { error: err })
      globalLogger.error('[step handler] invalid JSON schema', { step: step.config.name, error: err })
      return
    }

    const valid = validate(data)

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

      const printer = motia?.printer ?? new Printer(process.cwd())
      printer.printEventInputValidationError({ topic: event.topic }, { missingFields, extraFields, typeMismatches })
    }
  }
}
