import { z } from 'zod'
import { Step } from './types'

const AWS_LAMBDA_LIMITS = {
  MIN_RAM_MB: 128,
  MAX_RAM_MB: 10240,
  MIN_TIMEOUT_SECONDS: 1,
  MAX_TIMEOUT_SECONDS: 900,
} as const

const AWS_LAMBDA_CPU_RATIO: Record<number, number> = {
  128: 0.0625,
  256: 0.125,
  512: 0.25,
  1024: 0.5,
  1536: 0.75,
  2048: 1,
  3008: 1.5,
  4096: 2,
  5120: 2.5,
  6144: 3,
  7168: 3.5,
  8192: 4,
  9216: 4.5,
  10240: 5,
}

function getProportionalCpu(ramMb: number): number {
  const ramValues = Object.keys(AWS_LAMBDA_CPU_RATIO).map(Number).sort((a, b) => a - b)
  
  const exact = AWS_LAMBDA_CPU_RATIO[ramMb]
  if (exact !== undefined) {
    return exact
  }
  
  for (let i = 0; i < ramValues.length - 1; i++) {
    const lower = ramValues[i]
    const upper = ramValues[i + 1]
    
    if (ramMb > lower && ramMb < upper) {
      const lowerCpu = AWS_LAMBDA_CPU_RATIO[lower]
      const upperCpu = AWS_LAMBDA_CPU_RATIO[upper]
      const ratio = (ramMb - lower) / (upper - lower)
      return lowerCpu + (upperCpu - lowerCpu) * ratio
    }
  }
  
  return ramMb <= ramValues[0]
    ? AWS_LAMBDA_CPU_RATIO[ramValues[0]]
    : AWS_LAMBDA_CPU_RATIO[ramValues[ramValues.length - 1]]
}

const handlerBaseSchema = z.object({
  ram: z.number()
    .min(AWS_LAMBDA_LIMITS.MIN_RAM_MB, `RAM must be at least ${AWS_LAMBDA_LIMITS.MIN_RAM_MB} MB`)
    .max(AWS_LAMBDA_LIMITS.MAX_RAM_MB, `RAM cannot exceed ${AWS_LAMBDA_LIMITS.MAX_RAM_MB} MB`),
  timeout: z.number()
    .min(AWS_LAMBDA_LIMITS.MIN_TIMEOUT_SECONDS, `Timeout must be at least ${AWS_LAMBDA_LIMITS.MIN_TIMEOUT_SECONDS}s`)
    .max(AWS_LAMBDA_LIMITS.MAX_TIMEOUT_SECONDS, `Timeout cannot exceed ${AWS_LAMBDA_LIMITS.MAX_TIMEOUT_SECONDS}s`),
  cpu: z.number().optional(),
  machineType: z.enum(['cpu', 'memory', 'gpu']),
})

const handlerSchema = handlerBaseSchema.superRefine((handler, ctx) => {
  if (handler.cpu === undefined || handler.ram === undefined) {
    return
  }
  
  const expectedCpu = getProportionalCpu(handler.ram)
  const tolerance = 0.1
  
  if (Math.abs(handler.cpu - expectedCpu) > tolerance) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['cpu'],
      message: `CPU (${handler.cpu} vCPU) is not proportional to RAM (${handler.ram} MB). Expected approximately ${expectedCpu.toFixed(2)} vCPU`,
    })
  }
})

const queueSchema = z.object({
  type: z.enum(['standard', 'fifo']),
  visibilityTimeout: z.number(),
  messageGroupId: z.string().nullable().optional(),
  maxRetries: z.number().min(0, 'maxRetries cannot be negative'),
  retryStrategy: z.enum(['none', 'exponential', 'jitter']),
})

const infrastructureSchema = z.object({
  handler: handlerBaseSchema.partial().optional(),
  queue: queueSchema.partial().optional(),
}).superRefine((config, ctx) => {
  if (config.handler?.cpu !== undefined && config.handler?.ram !== undefined) {
    const expectedCpu = getProportionalCpu(config.handler.ram)
    const tolerance = 0.1
    
    if (Math.abs(config.handler.cpu - expectedCpu) > tolerance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['handler', 'cpu'],
        message: `CPU (${config.handler.cpu} vCPU) is not proportional to RAM (${config.handler.ram} MB). Expected approximately ${expectedCpu.toFixed(2)} vCPU`,
      })
    }
  }
  
  if (config.queue?.visibilityTimeout !== undefined && config.handler?.timeout !== undefined) {
    if (config.queue.visibilityTimeout <= config.handler.timeout) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['queue', 'visibilityTimeout'],
        message: `Visibility timeout (${config.queue.visibilityTimeout}s) must be greater than handler timeout (${config.handler.timeout}s) to prevent premature message redelivery`,
      })
    }
  }
  
  if (config.queue?.type === 'fifo' && !config.queue?.messageGroupId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['queue', 'messageGroupId'],
      message: 'messageGroupId is required when queue type is "fifo"',
    })
  }
})

function createInfrastructureSchema(inputSchema?: z.ZodObject<any>) {
  return infrastructureSchema.superRefine((config, ctx) => {
    const messageGroupId = config.queue?.messageGroupId
    
    if (!messageGroupId) {
      return
    }
    
    if (!inputSchema) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['queue', 'messageGroupId'],
        message: `Cannot validate messageGroupId "${messageGroupId}" - step has no input schema defined`,
      })
      return
    }
    
    if (messageGroupId.includes('.') || messageGroupId.includes('[')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['queue', 'messageGroupId'],
        message: `messageGroupId "${messageGroupId}" must be a simple field path. Nested paths and template expressions are not supported`,
      })
      return
    }
    
    try {
      const shape = inputSchema.shape
      if (!shape || !(messageGroupId in shape)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['queue', 'messageGroupId'],
          message: `messageGroupId "${messageGroupId}" does not exist in step's input schema`,
        })
      }
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['queue', 'messageGroupId'],
        message: `Failed to validate messageGroupId "${messageGroupId}" against input schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  })
}

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

const noopSchema = z
  .object({
    type: z.literal('noop'),
    name: z.string(),
    description: z.string().optional(),
    virtualEmits: emits,
    virtualSubscribes: z.array(z.string()),
    flows: z.array(z.string()).optional(),
  })
  .strict()

const eventSchema = z
  .object({
    type: z.literal('event'),
    name: z.string(),
    description: z.string().optional(),
    subscribes: z.array(z.string()),
    emits: emits,
    virtualEmits: emits.optional(),
    virtualSubscribes: z.array(z.string()).optional(),
    input: z.union([jsonSchema, z.object({}), z.null()]).optional(),
    flows: z.array(z.string()).optional(),
    includeFiles: z.array(z.string()).optional(),
    infrastructure: z.any().optional(),
  })
  .strict()

const apiSchema = z
  .object({
    type: z.literal('api'),
    name: z.string(),
    description: z.string().optional(),
    path: z.string(),
    method: z.string(),
    emits: emits,
    virtualEmits: emits.optional(),
    virtualSubscribes: z.array(z.string()).optional(),
    flows: z.array(z.string()).optional(),
    includeFiles: z.array(z.string()).optional(),
    middleware: z.array(z.any()).optional(),
    queryParams: z.array(z.object({ name: z.string(), description: z.string().optional() })).optional(),
    bodySchema: z.union([jsonSchema, z.object({}), z.null()]).optional(),
    responseSchema: z.record(z.string(), jsonSchema).optional(),
    infrastructure: z.any().optional(),
  })
  .strict()

const cronSchema = z
  .object({
    type: z.literal('cron'),
    name: z.string(),
    description: z.string().optional(),
    cron: z.string(),
    virtualEmits: emits.optional(),
    virtualSubscribes: z.array(z.string()).optional(),
    emits: emits,
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
    if (step.config.type === 'noop') {
      noopSchema.parse(step.config)
    } else if (step.config.type === 'event') {
      eventSchema.parse(step.config)
    } else if (step.config.type === 'api') {
      apiSchema.parse(step.config)
    } else if (step.config.type === 'cron') {
      cronSchema.parse(step.config)
    } else {
      return {
        success: false,
        error: 'Invalid step type',
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

export type InfrastructureValidationError = {
  path: string
  message: string
}

export type InfrastructureValidationResult = {
  success: boolean
  errors?: InfrastructureValidationError[]
}

export function validateInfrastructureConfig(
  infrastructureConfig: unknown,
  stepName: string,
  inputSchema?: z.ZodObject<any>
): InfrastructureValidationResult {
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
      errors: [{
        path: 'infrastructure',
        message: `Unexpected validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
    }
  }
}

export {
  AWS_LAMBDA_LIMITS,
  AWS_LAMBDA_CPU_RATIO,
  getProportionalCpu,
  handlerSchema,
  queueSchema,
  infrastructureSchema,
  createInfrastructureSchema,
}
