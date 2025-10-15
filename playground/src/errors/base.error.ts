export class BaseError extends Error {
  public readonly status: number
  public readonly code: string
  public readonly metadata: Record<string, any>

  constructor(
    message: string,
    status: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    metadata: Record<string, any> = {}
  ) {
    super(message)
    this.name = this.constructor.name
    this.status = status
    this.code = code
    this.metadata = metadata

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        status: this.status,
        ...(Object.keys(this.metadata).length > 0 && { metadata: this.metadata }),
      },
    }
  }
}

