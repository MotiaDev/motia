import { ApiMiddleware } from 'motia'
import { ZodError } from 'zod'
import { BaseError } from '../errors/base.error'

export const coreMiddleware: ApiMiddleware = async (req, ctx, next) => {
  const logger = ctx.logger

  try {
    return await next()
  } catch (error: any) {
    if (error instanceof ZodError) {
      logger.error('Validation error', {
        error,
        stack: error.stack,
        errors: error.errors,
      })

      return {
        status: 400,
        body: {
          error: 'Invalid request body',
          data: error.errors,
        },
      }
    } else if (error instanceof BaseError) {
      logger.error('BaseError', {
        status: error.status,
        code: error.code,
        metadata: error.metadata,
        name: error.name,
        message: error.message,
      })

      return { status: error.status, body: error.toJSON() }
    }

    logger.error('Error while performing request', {
      error,
      body: req.body,
      stack: error.stack,
    })

    return { status: 500, body: { error: 'Internal Server Error' } }
  }
}

