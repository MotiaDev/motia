import type { ValidationError } from '../../new-deployment/listeners/listener.types'
import type { Builder } from '../builder'

export type ValidationResult = {
  errors: ValidationError[]
  warnings: ValidationError[]
}

export type Validator = (builder: Builder) => ValidationResult
