import { z } from 'zod'
import { ZodInput } from '../types'

export const AWS_LAMBDA_LIMITS = {
    MIN_RAM_MB: 128,
    MAX_RAM_MB: 10240,
    MIN_TIMEOUT_SECONDS: 1,
    MAX_TIMEOUT_SECONDS: 900,
} as const

export const AWS_LAMBDA_CPU_RATIO: Record<number, number> = {
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

export function getProportionalCpu(ramMb: number): number {
    const ramValues = Object.keys(AWS_LAMBDA_CPU_RATIO)
        .map(Number)
        .sort((a, b) => a - b)

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

export const handlerBaseSchema = z.object({
    ram: z
        .number()
        .min(AWS_LAMBDA_LIMITS.MIN_RAM_MB, `RAM must be at least ${AWS_LAMBDA_LIMITS.MIN_RAM_MB} MB`)
        .max(AWS_LAMBDA_LIMITS.MAX_RAM_MB, `RAM cannot exceed ${AWS_LAMBDA_LIMITS.MAX_RAM_MB} MB`),
    timeout: z
        .number()
        .min(AWS_LAMBDA_LIMITS.MIN_TIMEOUT_SECONDS, `Timeout must be at least ${AWS_LAMBDA_LIMITS.MIN_TIMEOUT_SECONDS}s`)
        .max(AWS_LAMBDA_LIMITS.MAX_TIMEOUT_SECONDS, `Timeout cannot exceed ${AWS_LAMBDA_LIMITS.MAX_TIMEOUT_SECONDS}s`),
    cpu: z.number().optional(),
    machineType: z.enum(['cpu', 'memory', 'gpu']),
})

export const handlerSchema = handlerBaseSchema.partial().superRefine((handler, ctx) => {
    if (handler.cpu === undefined || handler.ram === undefined) {
        return
    }

    const expectedCpu = getProportionalCpu(handler.ram)
    const tolerance = 0.1

    if (Math.abs(handler.cpu - expectedCpu) > tolerance) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['handler', 'cpu'],
            message: `CPU (${handler.cpu} vCPU) is not proportional to RAM (${handler.ram} MB). Expected approximately ${expectedCpu.toFixed(2)} vCPU`,
        })
    }
})

export const queueSchema = z.object({
    type: z.enum(['standard', 'fifo']),
    visibilityTimeout: z.number(),
    messageGroupId: z.string().nullable().optional(),
    maxRetries: z.number().min(0, 'maxRetries cannot be negative'),
    retryStrategy: z.enum(['none', 'exponential', 'jitter']),
})

export const infrastructureSchema = z
    .object({
        handler: handlerSchema.optional(),
        queue: queueSchema.partial().optional(),
    })
    .superRefine((config, ctx) => {
        // if (config.handler?.cpu !== undefined && config.handler?.ram !== undefined) {
        //     const expectedCpu = getProportionalCpu(config.handler.ram)
        //     const tolerance = 0.1

        //     if (Math.abs(config.handler.cpu - expectedCpu) > tolerance) {
        //         ctx.addIssue({
        //             code: z.ZodIssueCode.custom,
        //             path: ['handler', 'cpu'],
        //             message: `CPU (${config.handler.cpu} vCPU) is not proportional to RAM (${config.handler.ram} MB). Expected approximately ${expectedCpu.toFixed(2)} vCPU`,
        //         })
        //     }
        // }

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

export const createInfrastructureSchema = (inputSchema?: ZodInput) => {
    return infrastructureSchema.superRefine((config, ctx) => {
        const messageGroupId = config.queue?.messageGroupId

        if (!messageGroupId || messageGroupId === 'traceId') {
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
            if (inputSchema instanceof z.ZodObject) {
                const shape = inputSchema.shape
                if (!shape || !(messageGroupId in shape)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['queue', 'messageGroupId'],
                        message: `messageGroupId "${messageGroupId}" does not exist in step's input schema`,
                    })
                }
            } else if (typeof inputSchema === 'object' && inputSchema !== null && 'properties' in inputSchema) {
                const properties = (inputSchema as any).properties
                if (!properties || typeof properties !== 'object' || !(messageGroupId in properties)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['queue', 'messageGroupId'],
                        message: `messageGroupId "${messageGroupId}" does not exist in step's input schema`,
                    })
                }
            } else {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['queue', 'messageGroupId'],
                    message: `Failed to validate messageGroupId "${messageGroupId}" against input schema: inputSchema is not a valid schema object`,
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
