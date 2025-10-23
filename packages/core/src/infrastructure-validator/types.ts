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

export type QueueValidationError = {
  path: string
  message: string
}

export type QueueValidationResult =
  | {
      success: true
    }
  | {
      success: false
      errors?: QueueValidationError[]
    }
