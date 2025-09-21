import { z } from 'zod'
import { Step } from './types'

const objectSchema = z.object({
  type: z.literal('object'),
  properties: z.record(z.any()),
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

// Base trigger schema
const baseTriggerSchema = z.object({
  type: z.string(),
  description: z.string().optional(),
})

// Event trigger schema
const eventTriggerSchema = baseTriggerSchema.extend({
  type: z.literal('event'),
  topic: z.string(),
  condition: z.function().optional(),
})

// API trigger schema
const apiTriggerSchema = baseTriggerSchema.extend({
  type: z.literal('api'),
  path: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']),
})

// Cron trigger schema
const cronTriggerSchema = baseTriggerSchema.extend({
  type: z.literal('cron'),
  cron: z.string(),
})

// State trigger schema
const stateTriggerSchema = baseTriggerSchema.extend({
  type: z.literal('state'),
  key: z.string(),
  condition: z.function().optional(),
})

// Union of all trigger types
const triggerSchema = z.union([
  eventTriggerSchema,
  apiTriggerSchema,
  cronTriggerSchema,
  stateTriggerSchema,
])

// Unified StepConfig schema
const stepConfigSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    triggers: z.array(triggerSchema),
    emits: emits.optional(),
    // Optional attributes for different trigger types
    path: z.string().optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']).optional(),
    cron: z.string().optional(),
    virtualEmits: emits.optional(),
    virtualSubscribes: z.array(z.string()).optional(),
    input: z.union([jsonSchema, z.object({}), z.null()]).optional(),
    responseSchema: z.record(z.string(), jsonSchema).optional(),
    queryParams: z.array(z.object({ name: z.string(), description: z.string().optional() })).optional(),
    middleware: z.array(z.any()).optional(),
    flows: z.array(z.string()).optional(),
    includeFiles: z.array(z.string()).optional(),
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
    // Validate the unified StepConfig structure
    stepConfigSchema.parse(step.config)

    // Additional validation: ensure triggers array is not empty for active steps
    if (step.config.triggers.length === 0) {
      // This is allowed for noop/dev steps, but we should warn
      return { success: true }
    }

    // Validate that trigger-specific attributes are consistent
    const hasApiTriggers = step.config.triggers.some(t => t.type === 'api')
    const hasCronTriggers = step.config.triggers.some(t => t.type === 'cron')
    
    // If there are API triggers, ensure path and method are defined
    if (hasApiTriggers && (!step.config.path || !step.config.method)) {
      return {
        success: false,
        error: 'API triggers require path and method to be defined in step config',
      }
    }
    
    // If there are cron triggers, ensure cron expression is defined
    if (hasCronTriggers && !step.config.cron) {
      return {
        success: false,
        error: 'Cron triggers require cron expression to be defined in step config',
      }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((err) => err.message).join(', '),
        errors: error.errors.map((err) => ({ path: err.path.join('.'), message: err.message })),
      }
    }

    // Handle unexpected errors
    return {
      success: false,
      error: 'Unexpected validation error occurred',
    }
  }
}
