import { prettyPrint } from './pretty-print'

const logLevel = process.env.LOG_LEVEL ?? 'info'

const isDebugEnabled = logLevel === 'debug'
const isInfoEnabled = ['info', 'debug'].includes(logLevel)
const isWarnEnabled = ['warn', 'info', 'debug', 'trace'].includes(logLevel)

export class Logger {
  constructor(
    readonly isVerbose: boolean = false,
    private readonly meta: Record<string, unknown> = {},
    private readonly listeners: ((level: string, msg: string, args?: unknown) => void)[] = [],
  ) {}

  child(meta: Record<string, unknown> = {}): this {
    return new Logger(this.isVerbose, { ...this.meta, ...meta }, this.listeners) as this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _log(level: string, msg: string, args?: any) {
    const time = Date.now()
    prettyPrint({ level, time, msg, ...this.meta, ...(args ?? {}) }, !this.isVerbose)
    this.listeners.forEach((listener) => listener(level, msg, args))
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

  addListener(listener: (level: string, msg: string, args?: unknown) => void) {
    this.listeners.push(listener)
  }
}

export const globalLogger = new Logger()
