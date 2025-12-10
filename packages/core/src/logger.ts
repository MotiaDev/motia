import { prettyPrint } from './pretty-print'

const LEVELS = {
  NOTSET: 0,
  DEBUG: 10,
  INFO: 20,
  WARNING: 30,
  ERROR: 40,
  CRITICAL: 50,
} as const

const levelMap: Record<string, number> = {
  debug: LEVELS.DEBUG,
  info: LEVELS.INFO,
  warn: LEVELS.WARNING,
  warning: LEVELS.WARNING,
  error: LEVELS.ERROR,
  critical: LEVELS.CRITICAL,
}

const getLogLevel = (): number => {
  const level = process.env.LOG_LEVEL ?? 'info'
  return levelMap[level] ?? LEVELS.INFO
}

const shouldLog = (messageLevel: number): boolean => {
  return messageLevel >= getLogLevel()
}

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

  private _log(level: string, msg: string, args?: any) {
    const time = Date.now()
    const meta = { ...this.meta, ...(args ?? {}) }
    prettyPrint({ level, time, msg, ...meta }, !this.isVerbose)

    this.coreListeners.forEach((listener) => listener(level, msg, meta))
    this.listeners.forEach((listener) => listener(level, msg, meta))
  }

  info(message: string, args?: unknown) {
    if (shouldLog(LEVELS.INFO)) {
      this._log('info', message, args)
    }
  }

  error(message: string, args?: unknown) {
    if (shouldLog(LEVELS.ERROR)) {
      this._log('error', message, args)
    }
  }

  debug(message: string, args?: unknown) {
    if (shouldLog(LEVELS.DEBUG)) {
      this._log('debug', message, args)
    }
  }

  warn(message: string, args?: unknown) {
    if (shouldLog(LEVELS.WARNING)) {
      this._log('warn', message, args)
    }
  }

  log(args: any) {
    const level = args.level ?? 'info'
    const messageLevel = levelMap[level] ?? LEVELS.INFO

    if (!shouldLog(messageLevel)) return

    this._log(level, args.msg, args)
  }

  addListener(listener: LogListener) {
    this.listeners.push(listener)
  }

  removeListener(listener: LogListener) {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }
}

export const globalLogger = new Logger()
