import { z } from 'zod'
import type { Step } from './types'

const objectSchema = z.object({
  type: z.literal('object'),
  properties: z.record(z.string(), z.any()),
  required: z.array(z.string()).optional(),
  additionalProperties: z.boolean().optional(),
  description: z.string().optional(),
  title: z.string().optional(),
})

const arraySchema = z.object({
  type: z.literal('array'),
  items: objectSchema,
  description: z.string().optional(),
  title: z.string().optional(),
})

const jsonSchema = z.any().refine((data) => {
  if (!data) {
    return true
  } else if (data.type === 'object') {
    return objectSchema.parse(data)
  } else if (data.type === 'array') {
    return arraySchema.parse(data)
  }

  return true
})

const emits = z.array(
  z.union([
    z.string(),
    z
      .object({
        topic: z.string(),
        label: z.string().optional(),
        conditional: z.boolean().optional(),
      })
      .strict(),
  ]),
)

const eventTriggerSchema = z
  .object({
    type: z.literal('event'),
    topic: z.string(),
    input: z.union([jsonSchema, z.object({}), z.null()]).optional(),
    condition: z.any().optional(),
  })
  .strict()

const apiTriggerSchema = z
  .object({
    type: z.literal('api'),
    path: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']),
    bodySchema: z.union([jsonSchema, z.object({}), z.null()]).optional(),
    responseSchema: z.record(z.string(), jsonSchema).optional(),
    queryParams: z
      .array(
        z.object({
          name: z.string(),
          description: z.string().optional(),
        }),
      )
      .optional(),
    middleware: z.array(z.any()).optional(),
    condition: z.any().optional(),
  })
  .strict()

const cronTriggerSchema = z
  .object({
    type: z.literal('cron'),
    expression: z.string(),
    condition: z.any().optional(),
  })
  .strict()

const triggerSchema = z.discriminatedUnion('type', [eventTriggerSchema, apiTriggerSchema, cronTriggerSchema])

const stepConfigSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    triggers: z.array(triggerSchema).min(1),
    emits: emits.optional(),
    virtualEmits: emits.optional(),
    virtualSubscribes: z.array(z.string()).optional(),
    flows: z.array(z.string()).optional(),
    includeFiles: z.array(z.string()).optional(),
    infrastructure: z.any().optional(),
  })
  .strict()

export type ValidationSuccess = {
  success: true
}

export type ValidationError = {
  success: false
  error: string
  errors?: Array<{ path: string; message: string }>
}

export type ValidationResult = ValidationSuccess | ValidationError

export const validateStep = (step: Step): ValidationResult => {
  try {
    stepConfigSchema.parse(step.config)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((err) => err.message).join(', '),
        errors: error.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      }
    }

    return {
      success: false,
      error: 'Unexpected validation error occurred',
    }
  }
}
