import { randomUUID } from 'crypto'
import { DefaultLoggerAdapter } from './adapters/defaults/logger/default-logger-adapter'
import type { LoggerAdapter } from './adapters/interfaces/logger-adapter.interface'
import type { Logger, LogListener } from './logger'
import type { Log } from './streams/logs-stream'
import type { MotiaStream } from './types-stream'

type CreateLogger = {
  traceId: string
  flows?: string[]
  stepName: string
}

export interface LoggerFactory {
  create: (args: CreateLogger) => Logger
}

export class BaseLoggerFactory implements LoggerFactory {
  private readonly loggerAdapter: LoggerAdapter

  constructor(
    private readonly isVerbose: boolean,
    private readonly logStream: MotiaStream<Log>,
    loggerAdapter?: LoggerAdapter,
  ) {
    this.loggerAdapter = loggerAdapter || new DefaultLoggerAdapter(isVerbose)
  }

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
