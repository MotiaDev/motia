import type { Logger, LogListener } from '../../../logger'
import { prettyPrint } from '../../../pretty-print'
import type { LoggerAdapter } from '../../interfaces/logger-adapter.interface'

const logLevel = process.env.LOG_LEVEL ?? 'info'

const isDebugEnabled = logLevel === 'debug'
const isInfoEnabled = ['info', 'debug'].includes(logLevel)
const isWarnEnabled = ['warn', 'info', 'debug', 'trace'].includes(logLevel)

export class DefaultLogger implements Logger {
  readonly isVerbose: boolean

  private readonly listeners: LogListener[] = []
  private readonly meta: Record<string, unknown>
  private readonly coreListeners: LogListener[]

  constructor(isVerbose: boolean = false, meta: Record<string, unknown> = {}, coreListeners: LogListener[] = []) {
    this.isVerbose = isVerbose
    this.meta = meta
    this.coreListeners = coreListeners
  }

  child(meta: Record<string, unknown>): Logger {
    return new DefaultLogger(this.isVerbose, { ...this.meta, ...meta }, this.coreListeners)
  }

  private _log(level: string, msg: string, args?: unknown) {
    const time = Date.now()
    const meta = { ...this.meta, ...(args ?? {}) }
    prettyPrint({ level, time, msg, ...meta }, !this.isVerbose)

    this.coreListeners.forEach((listener) => listener(level, msg, meta))
    this.listeners.forEach((listener) => listener(level, msg, meta))
  }

  info(message: string, args?: unknown) {
    if (isInfoEnabled) {
      this._log('info', message, args)
    }
  }

  error(message: string, args?: unknown) {
    this._log('error', message, args)
  }

  debug(message: string, args?: unknown) {
    if (isDebugEnabled) {
      this._log('debug', message, args)
    }
  }

  warn(message: string, args?: unknown) {
    if (isWarnEnabled) {
      this._log('warn', message, args)
    }
  }

  log(args: unknown) {
    const logArgs = args as { level?: string; msg?: string }
    this._log(logArgs.level ?? 'info', logArgs.msg ?? '', args)
  }

  addListener(listener: LogListener) {
    this.listeners.push(listener)
  }
}

export class DefaultLoggerAdapter implements LoggerAdapter {
  constructor(private readonly isVerbose: boolean = false) {}

  createLogger(meta: Record<string, unknown>, coreListeners?: LogListener[]): Logger {
    return new DefaultLogger(this.isVerbose, meta, coreListeners || [])
  }
}
