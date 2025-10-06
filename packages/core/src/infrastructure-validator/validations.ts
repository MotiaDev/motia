import { z } from 'zod'
import { createInfrastructureSchema } from './schemas'
import { InfrastructureValidationError, InfrastructureValidationResult } from './types'
import { ZodInput } from '../types'

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
