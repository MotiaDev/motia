import { AnyValue, AnyValueMap, SeverityNumber } from '@opentelemetry/api-logs'
import {
  currentSpanId,
  currentTraceId,
  getLogger as getOtelLogger,
} from './telemetry-system'

/** @internal */
export type LoggerParams = {
  message: string
  trace_id?: string
  span_id?: string
  service_name?: string
  data?: unknown
  /** @deprecated Use service_name instead */
  function_name?: string
}

/**
 * Structured logger that emits logs via OpenTelemetry. Falls back to
 * `console.*` when OTel is not initialized.
 *
 * @example
 * ```typescript
 * import { Logger } from 'iii-sdk'
 *
 * const logger = new Logger()
 * logger.info('Processing started')
 * logger.error('Something failed', { orderId: '123' })
 * ```
 */
export class Logger {
  private _otelLogger: ReturnType<typeof getOtelLogger> | null = null

  private get otelLogger() {
    // Lazy initialization: re-fetch logger if not yet available
    if (!this._otelLogger) {
      this._otelLogger = getOtelLogger()
    }
    return this._otelLogger
  }

  constructor(
    private readonly traceId?: string,
    private readonly serviceName?: string,
    private readonly spanId?: string,
  ) {}

  private emit(message: string, severity: SeverityNumber, data?: unknown): void {
    const attributes: AnyValueMap = {}
    const traceId = this.traceId ?? currentTraceId()
    const spanId = this.spanId ?? currentSpanId()

    if (traceId) {
      attributes.trace_id = traceId
    }
    if (spanId) {
      attributes.span_id = spanId
    }
    if (this.serviceName) {
      attributes['service.name'] = this.serviceName
    }
    if (data !== undefined) {
      attributes['log.data'] = data as AnyValue
    }

    if (this.otelLogger) {
      this.otelLogger.emit({
        severityNumber: severity,
        body: message,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      })
    } else {
      // Fallback to console when OTEL is not available
      switch (severity) {
        case SeverityNumber.DEBUG:
          console.debug(message, data)
          break
        case SeverityNumber.INFO:
          console.info(message, data)
          break
        case SeverityNumber.WARN:
          console.warn(message, data)
          break
        case SeverityNumber.ERROR:
          console.error(message, data)
          break
        default:
          console.log(message, data)
      }
    }
  }

  /** Log an info-level message. */
  info(message: string, data?: unknown): void {
    this.emit(message, SeverityNumber.INFO, data)
  }

  /** Log a warning-level message. */
  warn(message: string, data?: unknown): void {
    this.emit(message, SeverityNumber.WARN, data)
  }

  /** Log an error-level message. */
  error(message: string, data?: unknown): void {
    this.emit(message, SeverityNumber.ERROR, data)
  }

  /** Log a debug-level message. */
  debug(message: string, data?: unknown): void {
    this.emit(message, SeverityNumber.DEBUG, data)
  }
}
