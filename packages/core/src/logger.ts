import { prettyPrint } from './pretty-print'

const logLevel = process.env.LOG_LEVEL ?? 'info'

const isDebugEnabled = logLevel === 'debug'
const isInfoEnabled = ['info', 'debug'].includes(logLevel)
const isWarnEnabled = ['warn', 'info', 'debug', 'trace'].includes(logLevel)

export type LogListener = (level: string, msg: string, args?: unknown) => void

export class Logger {
  /**
   * Why do we need two level of listeners?
   *
   * Core listeners pass along to children loggers.
   *
   * However, base listeners do not pass along to children loggers.
   * Those are specific to each logger in the hierarchy.
   */
  private readonly listeners: LogListener[] = []

  constructor(
    readonly isVerbose: boolean = false,
    private readonly meta: Record<string, unknown> = {},
    private readonly coreListeners: LogListener[] = [],
  ) {}

  child(meta: Record<string, unknown>): Logger {
    return new Logger(this.isVerbose, { ...this.meta, ...meta }, this.coreListeners)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _log(level: string, msg: string, args?: any) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(args: any) {
    this._log('info', args.msg, args)
  }

  addListener(listener: LogListener) {
    this.listeners.push(listener)
  }
}

export const globalLogger = new Logger()
