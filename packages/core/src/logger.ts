import { DefaultLoggerAdapter } from './adapters/defaults/logger/default-logger-adapter'

export type LogListener = (level: string, msg: string, args?: unknown) => void

export interface Logger {
  readonly isVerbose: boolean
  info(message: string, args?: unknown): void
  error(message: string, args?: unknown): void
  debug(message: string, args?: unknown): void
  warn(message: string, args?: unknown): void
  log(args: unknown): void
  child(meta: Record<string, unknown>): Logger
  addListener(listener: LogListener): void
}

export const globalLogger: Logger = new DefaultLoggerAdapter().createLogger({})
