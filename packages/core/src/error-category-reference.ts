import { ErrorCategory, ErrorCategoryResolver } from './errors'

/**
 * Reference implementation for error categorization based on error message heuristics.
 * This is NOT used by default in the framework, but can be set via setErrorCategoryResolver().
 */
export const referenceErrorCategoryResolver: ErrorCategoryResolver = (error?: Error) => {
  if (!error) return ErrorCategory.UNKNOWN

  const message = error.message.toLowerCase()

  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorCategory.VALIDATION
  }
  if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
    return ErrorCategory.NETWORK
  }
  if (message.includes('business') || message.includes('domain')) {
    return ErrorCategory.BUSINESS_LOGIC
  }
  if (message.includes('system') || message.includes('internal')) {
    return ErrorCategory.SYSTEM
  }

  return ErrorCategory.UNKNOWN
} 