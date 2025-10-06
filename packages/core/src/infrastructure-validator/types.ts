export type InfrastructureValidationError = {
  path: string
  message: string
}

export type InfrastructureValidationResult =
  | {
      success: true
    }
  | {
      success: false
      errors?: InfrastructureValidationError[]
    }
