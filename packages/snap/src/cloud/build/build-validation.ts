import { BuildListener } from '../new-deployment/listeners/listener.types'
import { Builder } from './builder'
import { Validator, ValidationResult } from './validations/types'
import { duplicateStepNamesValidator } from './validations/duplicate-step-names.validator'
import { stepBundleSizesValidator } from './validations/step-bundle-sizes.validator'
import { cronExpressionsValidator } from './validations/cron-expressions.validator'
import { apiEndpointsValidator } from './validations/api-endpoints.validator'
import { stepNameLengthsValidator } from './validations/step-name-lengths.validator'
import { infrastructureConfigsValidator } from './validations/infrastructure-configs.validator'
import { routerBundleSizesValidator } from './validations/router-bundle-sizes.validator'

export const buildValidation = (builder: Builder, listener: BuildListener) => {
  const { errors, warnings } = validateStepsConfig(builder)

  if (warnings.length > 0) {
    warnings.forEach((warning) => listener.onBuildWarning(warning))
  }

  if (errors.length > 0) {
    listener.onBuildErrors(errors)
    return false
  }

  return true
}

const validationPipeline: Validator[] = [
  duplicateStepNamesValidator,
  stepBundleSizesValidator,
  cronExpressionsValidator,
  apiEndpointsValidator,
  stepNameLengthsValidator,
  infrastructureConfigsValidator,
  routerBundleSizesValidator,
]

const runValidationPipeline = (builder: Builder, validators: Validator[]): ValidationResult => {
  return validators.reduce<ValidationResult>(
    (acc, validator) => {
      const result = validator(builder)
      return {
        errors: [...acc.errors, ...result.errors],
        warnings: [...acc.warnings, ...result.warnings],
      }
    },
    { errors: [], warnings: [] },
  )
}

export const validateStepsConfig = (builder: Builder): ValidationResult => {
  return runValidationPipeline(builder, validationPipeline)
}
