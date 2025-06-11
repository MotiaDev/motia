import { randomUUID } from 'crypto'
import { Logger } from './logger'
import { StreamAdapter } from './streams/adapters/stream-adapter'
import { Log } from './streams/logs-stream'

type CreateLogger = {
  traceId: string
  flows?: string[]
  stepName: string
}

export class LoggerFactory {
  constructor(
    private readonly isVerbose: boolean,
    private readonly logStream: StreamAdapter<Log>,
  ) {}

  create({ stepName, traceId, flows }: CreateLogger): Logger {
    const logger = new Logger(this.isVerbose, { traceId, flows, step: stepName })

    logger.addListener((level, msg, args) => {
      const id = randomUUID()

      this.logStream.set('default', id, {
        id,
        step: stepName,
        ...(args ?? {}),
        level,
        time: Date.now(),
        msg,
        traceId,
        flows: flows ?? [],
      })
    })

    return logger
  }
}
