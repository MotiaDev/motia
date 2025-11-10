import { randomUUID } from 'crypto'
import type { LoggerAdapter } from './adapters/interfaces/logger-adapter.interface'
import type { Logger, LogListener } from './logger'
import type { MotiaStream } from './types-stream'

export type Log = {
  id: string
  level: string
  time: number
  msg: string
  traceId: string
  flows: string[]
  [key: string]: any
}

type CreateLogger = {
  traceId: string
  flows?: string[]
  stepName: string
}

export interface LoggerFactory {
  create: (args: CreateLogger) => Logger
}

export class BaseLoggerFactory implements LoggerFactory {
  constructor(
    private readonly logStream: MotiaStream<Log>,
    private readonly loggerAdapter: LoggerAdapter,
  ) {}

  create({ stepName, traceId, flows }: CreateLogger): Logger {
    const streamListener: LogListener = (level, msg, args) => {
      const id = randomUUID()

      this.logStream.set('default', id, {
        id,
        ...(args ?? {}),
        level,
        time: Date.now(),
        msg,
        traceId,
        flows: flows ?? [],
      })
    }

    return this.loggerAdapter.createLogger({ traceId, flows, step: stepName }, [streamListener])
  }
}
