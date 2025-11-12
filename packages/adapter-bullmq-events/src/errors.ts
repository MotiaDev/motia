export class BullMQAdapterError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message)
    this.name = 'BullMQAdapterError'
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`
    }
  }
}

export class QueueCreationError extends BullMQAdapterError {
  constructor(queueName: string, cause?: Error) {
    super(`Failed to create queue: ${queueName}`, cause)
    this.name = 'QueueCreationError'
  }
}

export class WorkerCreationError extends BullMQAdapterError {
  constructor(topic: string, stepName: string, cause?: Error) {
    super(`Failed to create worker for topic ${topic}, step ${stepName}`, cause)
    this.name = 'WorkerCreationError'
  }
}

export class ConnectionError extends BullMQAdapterError {
  constructor(message: string, cause?: Error) {
    super(`Connection error: ${message}`, cause)
    this.name = 'ConnectionError'
  }
}
