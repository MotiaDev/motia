import { RpcSender } from './rpc'

export class Logger {
  constructor(
    private readonly traceId: string,
    private readonly flows: string[],
    private readonly sender: RpcSender,
  ) {}

  private _log(level: string, message: string, args?: Record<string, unknown>): void {
    const argsCopy = args ? { ...args } : {}

    if (argsCopy.error && argsCopy.error instanceof Error) {
      argsCopy.error = {
        ...argsCopy.error,
        message: argsCopy.error.message,
        stack: argsCopy.error.stack,
        name: argsCopy.error.name,
      }
    }

    const logEntry = {
      ...argsCopy,
      level,
      time: Date.now(),
      traceId: this.traceId,
      flows: this.flows,
      msg: message,
    }

    this.sender.sendNoWait('log', logEntry)
  }

  info(message: string, args?: Record<string, unknown>): void {
    this._log('info', message, args)
  }

  error(message: string, args?: Record<string, unknown>): void {
    this._log('error', message, args)
  }

  debug(message: string, args?: Record<string, unknown>): void {
    this._log('debug', message, args)
  }

  warn(message: string, args?: Record<string, unknown>): void {
    this._log('warn', message, args)
  }
}
