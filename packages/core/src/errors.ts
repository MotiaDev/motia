import { EventConfig, Step, CronConfig } from './types'

export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorContext {
  stepName: string
  stepType: string
  traceId: string
  flows?: string[]
  inputData?: unknown
  category: ErrorCategory
  timestamp: string
  stack?: string
}

export class MotiaError extends Error {
  public readonly category: ErrorCategory
  public readonly context: ErrorContext

  constructor(message: string, category: ErrorCategory, context: ErrorContext) {
    super(message)
    this.name = 'MotiaError'
    this.category = category
    this.context = context
  }
}

export type ErrorCategoryResolver = (error?: Error) => ErrorCategory

// Default resolver: always returns UNKNOWN
let errorCategoryResolver: ErrorCategoryResolver = () => ErrorCategory.UNKNOWN

export function setErrorCategoryResolver(resolver: ErrorCategoryResolver) {
  errorCategoryResolver = resolver
}

export function getErrorCategoryResolver(): ErrorCategoryResolver {
  return errorCategoryResolver
}

export const createErrorContext = <T extends EventConfig | CronConfig>(
  step: Step<T>,
  traceId: string,
  inputData?: unknown,
  error?: Error,
): ErrorContext => ({
  stepName: step.config.name,
  stepType: step.config.type,
  traceId,
  flows: step.config.flows,
  inputData,
  category: errorCategoryResolver(error),
  timestamp: new Date().toISOString(),
  stack: error?.stack,
})
