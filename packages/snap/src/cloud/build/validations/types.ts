import { ValidationError } from '../../new-deployment/listeners/listener.types'
import { Builder } from '../builder'

export type ValidationResult = {
  errors: ValidationError[]
  warnings: ValidationError[]
}

export type Validator = (builder: Builder) => ValidationResult

