import type { Logger, LogListener } from '../../logger'

export interface LoggerAdapter {
  createLogger(meta: Record<string, unknown>, coreListeners?: LogListener[]): Logger
  shutdown?(): Promise<void>
}
