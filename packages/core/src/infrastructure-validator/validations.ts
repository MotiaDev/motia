import { z } from 'zod'
import { infrastructureSchema, queueSchema } from './schemas'
import type {
  InfrastructureValidationError,
  InfrastructureValidationResult,
  QueueValidationError,
  QueueValidationResult,
} from './types'

export const validateQueueConfig = (queueConfig: unknown): QueueValidationResult => {
  try {
    const schema = queueSchema
    schema.parse(queueConfig)

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: QueueValidationError[] = error.issues.map((err) => ({
        path: err.path.length > 0 ? err.path.join('.') : 'queue',
        message: err.message,
      }))

      return {
        success: false,
        errors,
      }
    }

    return {
      success: false,
      errors: [
        {
          path: 'queue',
          message: `Unexpected validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
    }
  }
}
export const validateInfrastructureConfig = (infrastructureConfig: unknown): InfrastructureValidationResult => {
  try {
    infrastructureSchema.parse(infrastructureConfig)

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: InfrastructureValidationError[] = error.issues.map((err) => ({
        path: err.path.length > 0 ? err.path.join('.') : 'infrastructure',
        message: err.message,
      }))

      return {
        success: false,
        errors,
      }
    }

    return {
      success: false,
      errors: [
        {
          path: 'infrastructure',
          message: `Unexpected validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
    }
  }
}
