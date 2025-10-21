import Ajv, { ErrorObject } from 'ajv'
import type { Event, Step, EventConfig } from './types'
import { globalLogger } from './logger'

const ajv = new Ajv({ allErrors: true, strict: false })

export const validateEventInput = (step: Step<EventConfig>, event: Event, motia: any) => {
  const { data } = event
  const logger = event.logger.child({ step: step.config.name })

  if (step.config.input) {
    if (data === null || typeof data !== 'object') {
      logger.warn(`⚠️ Event "${step.config.name}" received non-object data`, { data })
      return
    }

    const validate = ajv.compile(step.config.input)
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
