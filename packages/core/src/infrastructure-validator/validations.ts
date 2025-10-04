import { z } from 'zod'
import { createInfrastructureSchema, createQueueSchema } from './schemas'
import {
  InfrastructureValidationError,
  InfrastructureValidationResult,
  QueueValidationError,
  QueueValidationResult,
} from './types'
import { ZodInput } from '../types'

export const validateQueueConfig = (queueConfig: unknown): QueueValidationResult => {
  try {
    const schema = createQueueSchema()
    schema.parse(queueConfig)

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: QueueValidationError[] = error.errors.map((err) => ({
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
export const validateInfrastructureConfig = (
  infrastructureConfig: unknown,
  inputSchema?: ZodInput,
): InfrastructureValidationResult => {
  try {
    const schema = createInfrastructureSchema(inputSchema)
    schema.parse(infrastructureConfig)

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: InfrastructureValidationError[] = error.errors.map((err) => ({
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
