import { context } from '@opentelemetry/api'
import { createRequire } from 'node:module'
import * as os from 'node:os'
import { type Data, WebSocket } from 'ws'
import { ChannelReader, ChannelWriter } from './channels'
import {
  type IIIConnectionState,
  type IIIReconnectionConfig,
  DEFAULT_BRIDGE_RECONNECTION_CONFIG,
  DEFAULT_INVOCATION_TIMEOUT_MS,
  EngineFunctions,
  EngineTriggers,
} from './iii-constants'
import {
  type IIIMessage,
  type FunctionInfo,
  type HttpInvocationConfig,
  type InvocationResultMessage,
  type InvokeFunctionMessage,
  MessageType,
  type RegisterFunctionMessage,
  type RegisterServiceMessage,
  type RegisterTriggerMessage,
  type RegisterTriggerTypeMessage,
  type TriggerRegistrationResultMessage,
  type WorkerInfo,
  type WorkerRegisteredMessage,
  type StreamChannelRef,
} from './iii-types'
import { withContext } from './context'
import { Logger } from './logger'
import type { IStream } from './stream'
import {
  currentSpanId,
  currentTraceId,
  extractContext,
  getLogger,
  getMeter,
  getTracer,
  injectBaggage,
  injectTraceparent,
  initOtel,
  shutdownOtel,
  SeverityNumber,
  SpanKind,
  withSpan,
  type OtelConfig,
} from './telemetry-system'
import { registerWorkerGauges, stopWorkerGauges } from './otel-worker-gauges'
import type { TriggerHandler } from './triggers'
import type {
  ISdk,
  FunctionsAvailableCallback,
  Invocation,
  LogCallback,
  LogConfig,
  LogSeverityLevel,
  OtelLogEvent,
  RemoteFunctionData,
  RemoteFunctionHandler,
  RemoteTriggerTypeData,
  Trigger,
  FunctionRef,
} from './types'
import { isChannelRef } from './utils'

const require = createRequire(import.meta.url)
const { version: SDK_VERSION } = require('../package.json')

function getOsInfo(): string {
  return `${os.platform()} ${os.release()} (${os.arch()})`
}

function getDefaultWorkerName(): string {
  return `${os.hostname()}:${process.pid}`
}

/** Callback type for connection state changes */
export type ConnectionStateCallback = (state: IIIConnectionState) => void

export type TelemetryOptions = {
  language?: string
  project_name?: string
  framework?: string
  amplitude_api_key?: string
}

export type InitOptions = {
  workerName?: string
  enableMetricsReporting?: boolean
  /** Default timeout for function invocations in milliseconds */
  invocationTimeoutMs?: number
  /** Configuration for WebSocket reconnection behavior */
  reconnectionConfig?: Partial<IIIReconnectionConfig>
  /** OpenTelemetry configuration. OTel is initialized automatically by default.
   * Set `{ enabled: false }` or env `OTEL_ENABLED=false/0/no/off` to disable.
   * The engineWsUrl is set automatically from the III address. */
  otel?: Omit<OtelConfig, 'engineWsUrl'>
  telemetry?: TelemetryOptions
}

class Sdk implements ISdk {
  private ws?: WebSocket
  private functions = new Map<string, RemoteFunctionData>()
  private httpFunctions = new Map<string, RegisterFunctionMessage>()
  private services = new Map<string, Omit<RegisterServiceMessage, 'functions'>>()
  private invocations = new Map<string, Invocation & { timeout?: NodeJS.Timeout }>()
  private triggers = new Map<string, RegisterTriggerMessage>()
  private triggerTypes = new Map<string, RemoteTriggerTypeData>()
  private functionsAvailableCallbacks = new Set<FunctionsAvailableCallback>()
  private functionsAvailableTrigger?: Trigger
  private functionsAvailableFunctionPath?: string
  private logCallbacks = new Map<LogCallback, LogConfig>()
  private logTrigger?: Trigger
  private logFunctionPath?: string
  private messagesToSend: Record<string, unknown>[] = []
  private workerName: string
  private workerId?: string
  private reconnectTimeout?: NodeJS.Timeout
  private metricsReportingEnabled: boolean
  private invocationTimeoutMs: number
  private reconnectionConfig: IIIReconnectionConfig
  private reconnectAttempt = 0
  private connectionState: IIIConnectionState = 'disconnected'
  private stateCallbacks = new Set<ConnectionStateCallback>()
  private isShuttingDown = false

  constructor(
    private readonly address: string,
    private readonly options?: InitOptions,
  ) {
    this.workerName = options?.workerName ?? getDefaultWorkerName()
    this.metricsReportingEnabled = options?.enableMetricsReporting ?? true
    this.invocationTimeoutMs = options?.invocationTimeoutMs ?? DEFAULT_INVOCATION_TIMEOUT_MS
    this.reconnectionConfig = {
      ...DEFAULT_BRIDGE_RECONNECTION_CONFIG,
      ...options?.reconnectionConfig,
    }

    // Initialize OpenTelemetry (enabled by default, opt-out via config or env)
    initOtel({ ...options?.otel, engineWsUrl: this.address })

    this.connect()
  }

  registerTriggerType = <TConfig>(
    triggerType: Omit<RegisterTriggerTypeMessage, 'message_type'>,
    handler: TriggerHandler<TConfig>,
  ): void => {
    this.sendMessage(MessageType.RegisterTriggerType, triggerType, true)
    this.triggerTypes.set(triggerType.id, {
      message: { ...triggerType, message_type: MessageType.RegisterTriggerType },
      handler,
    })
  }

  on = (event: string, callback: (arg?: unknown) => void): void => {
    this.ws?.on(event, callback)
  }

  unregisterTriggerType = (triggerType: Omit<RegisterTriggerTypeMessage, 'message_type'>): void => {
    this.sendMessage(MessageType.UnregisterTriggerType, triggerType, true)
    this.triggerTypes.delete(triggerType.id)
  }

  registerTrigger = (trigger: Omit<RegisterTriggerMessage, 'message_type' | 'id'>): Trigger => {
    const id = crypto.randomUUID()
    const fullTrigger: RegisterTriggerMessage = {
      ...trigger,
      id,
      message_type: MessageType.RegisterTrigger,
    }
    this.sendMessage(MessageType.RegisterTrigger, fullTrigger, true)
    this.triggers.set(id, fullTrigger)

    return {
      unregister: () => {
        this.sendMessage(MessageType.UnregisterTrigger, {
          id,
          message_type: MessageType.UnregisterTrigger,
          type: fullTrigger.type,
        })
        this.triggers.delete(id)
      },
    }
  }

  registerFunction = (
    message: Omit<RegisterFunctionMessage, 'message_type'>,
    handler: RemoteFunctionHandler,
  ): FunctionRef => {
    if (!message.id || message.id.trim() === '') {
      throw new Error('id is required')
    }
    if (this.httpFunctions.has(message.id)) {
      throw new Error(`function id already registered: ${message.id}`)
    }

    this.sendMessage(MessageType.RegisterFunction, message, true)
    this.functions.set(message.id, {
      message: { ...message, message_type: MessageType.RegisterFunction },
      handler: async (input, traceparent?: string, baggage?: string) => {
        // If we have a tracer, wrap in a span and pass it to the context
        if (getTracer()) {
          // Extract both traceparent and baggage into a parent context
          const parentContext = extractContext(traceparent, baggage)

          return context.with(parentContext, () =>
            withSpan(`call ${message.id}`, { kind: SpanKind.SERVER }, async span => {
              const traceId = currentTraceId() ?? crypto.randomUUID()
              const spanId = currentSpanId()
              const logger = new Logger(traceId, message.id, spanId)
              const ctx = { logger, trace: span }

              return withContext(async () => await handler(input), ctx)
            }),
          )
        }

        // Fallback without tracing
        const traceId = crypto.randomUUID()
        const logger = new Logger(traceId, message.id)
        const ctx = { logger }

        return withContext(async () => await handler(input), ctx)
      },
    })

    return {
      id: message.id,
      unregister: () => {
        this.sendMessage(MessageType.UnregisterFunction, { id: message.id }, true)
        this.functions.delete(message.id)
      },
    }
  }

  registerHttpFunction = (id: string, config: HttpInvocationConfig): FunctionRef => {
    if (!id || id.trim() === '') {
      throw new Error('id is required')
    }
    if (this.functions.has(id) || this.httpFunctions.has(id)) {
      throw new Error(`function id already registered: ${id}`)
    }

    const message: RegisterFunctionMessage = {
      message_type: MessageType.RegisterFunction,
      id,
      invocation: {
        url: config.url,
        method: config.method ?? 'POST',
        timeout_ms: config.timeout_ms,
        headers: config.headers,
        auth: config.auth,
      },
    }

    this.sendMessage(MessageType.RegisterFunction, message, true)
    this.httpFunctions.set(id, message)

    return {
      id,
      unregister: () => {
        this.sendMessage(MessageType.UnregisterFunction, { id }, true)
        this.httpFunctions.delete(id)
      },
    }
  }

  registerService = (message: Omit<RegisterServiceMessage, 'message_type'>): void => {
    this.sendMessage(MessageType.RegisterService, message, true)
    this.services.set(message.id, { ...message, message_type: MessageType.RegisterService })
  }

  createChannel = async (bufferSize?: number): Promise<import('./types').Channel> => {
    const result = await this.call<
      { buffer_size?: number },
      { writer: StreamChannelRef; reader: StreamChannelRef }
    >('engine::channels::create', { buffer_size: bufferSize })

    return {
      writer: new ChannelWriter(this.address, result.writer),
      reader: new ChannelReader(this.address, result.reader),
      writerRef: result.writer,
      readerRef: result.reader,
    }
  }

  trigger = async <TInput, TOutput>(
    function_id: string,
    data: TInput,
    timeoutMs?: number,
  ): Promise<TOutput> => {
    const invocation_id = crypto.randomUUID()
    const traceparent = injectTraceparent()
    const baggage = injectBaggage()
    const effectiveTimeout = timeoutMs ?? this.invocationTimeoutMs

    return new Promise<TOutput>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const invocation = this.invocations.get(invocation_id)
        if (invocation) {
          this.invocations.delete(invocation_id)
          reject(new Error(`Invocation timeout after ${effectiveTimeout}ms: ${function_id}`))
        }
      }, effectiveTimeout)

      this.invocations.set(invocation_id, {
        resolve: (result: TOutput) => {
          clearTimeout(timeout)
          resolve(result)
        },
        reject: (error: unknown) => {
          clearTimeout(timeout)
          reject(error)
        },
        timeout,
      })

      this.sendMessage(MessageType.InvokeFunction, {
        invocation_id,
        function_id,
        data,
        traceparent,
        baggage,
      })
    })
  }

  triggerVoid = <TInput>(function_id: string, data: TInput): void => {
    const traceparent = injectTraceparent()
    const baggage = injectBaggage()
    this.sendMessage(MessageType.InvokeFunction, { function_id, data, traceparent, baggage })
  }

  call = async <TInput, TOutput>(
    function_id: string,
    data: TInput,
    timeoutMs?: number,
  ): Promise<TOutput> => this.trigger<TInput, TOutput>(function_id, data, timeoutMs)

  callVoid = <TInput>(function_id: string, data: TInput): void =>
    this.triggerVoid(function_id, data)

  listFunctions = async (): Promise<FunctionInfo[]> => {
    const result = await this.trigger<Record<string, never>, { functions: FunctionInfo[] }>(
      EngineFunctions.LIST_FUNCTIONS,
      {},
    )
    return result.functions
  }

  listWorkers = async (): Promise<WorkerInfo[]> => {
    const result = await this.trigger<Record<string, never>, { workers: WorkerInfo[] }>(
      EngineFunctions.LIST_WORKERS,
      {},
    )
    return result.workers
  }

  private registerWorkerMetadata(): void {
    const telemetryOpts = this.options?.telemetry
    const language =
      telemetryOpts?.language ??
      Intl.DateTimeFormat().resolvedOptions().locale ??
      process.env.LANG?.split('.')[0]

    this.triggerVoid(EngineFunctions.REGISTER_WORKER, {
      runtime: 'node',
      version: SDK_VERSION,
      name: this.workerName,
      os: getOsInfo(),
      telemetry: {
        language,
        project_name: telemetryOpts?.project_name,
        framework: telemetryOpts?.framework,
        amplitude_api_key: telemetryOpts?.amplitude_api_key,
      },
    })
  }

  createStream = <TData>(streamName: string, stream: IStream<TData>): void => {
    this.registerFunction({ id: `stream::get(${streamName})` }, stream.get.bind(stream))
    this.registerFunction({ id: `stream::set(${streamName})` }, stream.set.bind(stream))
    this.registerFunction({ id: `stream::delete(${streamName})` }, stream.delete.bind(stream))
    this.registerFunction({ id: `stream::list(${streamName})` }, stream.list.bind(stream))
    this.registerFunction(
      { id: `stream::list_groups(${streamName})` },
      stream.listGroups.bind(stream),
    )
  }

  onFunctionsAvailable = (callback: FunctionsAvailableCallback): (() => void) => {
    this.functionsAvailableCallbacks.add(callback)

    if (!this.functionsAvailableTrigger) {
      if (!this.functionsAvailableFunctionPath) {
        this.functionsAvailableFunctionPath = `engine.on_functions_available.${crypto.randomUUID()}`
      }

      const function_id = this.functionsAvailableFunctionPath
      if (!this.functions.has(function_id)) {
        this.registerFunction(
          { id: function_id },
          async ({ functions }: { functions: FunctionInfo[] }) => {
            this.functionsAvailableCallbacks.forEach(handler => {
              handler(functions)
            })
            return null
          },
        )
      }

      this.functionsAvailableTrigger = this.registerTrigger({
        type: EngineTriggers.FUNCTIONS_AVAILABLE,
        function_id,
        config: {},
      })
    }

    return () => {
      this.functionsAvailableCallbacks.delete(callback)
      if (this.functionsAvailableCallbacks.size === 0 && this.functionsAvailableTrigger) {
        this.functionsAvailableTrigger.unregister()
        this.functionsAvailableTrigger = undefined
      }
    }
  }

  onLog = (callback: LogCallback, config?: LogConfig): (() => void) => {
    const effectiveConfig = config ?? { level: 'all' }
    this.logCallbacks.set(callback, effectiveConfig)

    if (!this.logTrigger) {
      if (!this.logFunctionPath) {
        this.logFunctionPath = `engine.on_log.${crypto.randomUUID()}`
      }

      const function_id = this.logFunctionPath
      if (!this.functions.has(function_id)) {
        this.registerFunction({ id: function_id }, async (log: OtelLogEvent) => {
          this.logCallbacks.forEach((cfg, handler) => {
            try {
              const minSeverity = this.severityTextToNumber(cfg.level ?? 'all')
              if (cfg.level === 'all' || log.severity_number >= minSeverity) {
                handler(log)
              }
            } catch (error) {
              this.logError('Log callback handler threw an exception', error)
            }
          })
          return null
        })
      }

      this.logTrigger = this.registerTrigger({
        type: EngineTriggers.LOG,
        function_id,
        config: { level: 'all', severity_min: 0 },
      })
    }

    return () => {
      this.logCallbacks.delete(callback)
      if (this.logCallbacks.size === 0 && this.logTrigger) {
        this.logTrigger.unregister()
        this.logTrigger = undefined
      }
    }
  }

  /**
   * Get the current connection state.
   */
  getConnectionState = (): IIIConnectionState => {
    return this.connectionState
  }

  /**
   * Register a callback to be notified of connection state changes.
   * @returns A function to unregister the callback
   */
  onConnectionStateChange = (callback: ConnectionStateCallback): (() => void) => {
    this.stateCallbacks.add(callback)
    // Immediately notify of current state
    callback(this.connectionState)
    return () => this.stateCallbacks.delete(callback)
  }

  /**
   * Gracefully shutdown the iii, cleaning up all resources.
   */
  shutdown = async (): Promise<void> => {
    this.isShuttingDown = true

    this.stopMetricsReporting()

    // Shutdown OpenTelemetry
    await shutdownOtel()

    // Clear reconnection timeout
    this.clearReconnectTimeout()

    // Reject all pending invocations
    for (const [_id, invocation] of this.invocations) {
      if (invocation.timeout) {
        clearTimeout(invocation.timeout)
      }
      invocation.reject(new Error('iii is shutting down'))
    }
    this.invocations.clear()

    // Close WebSocket
    if (this.ws) {
      this.ws.removeAllListeners()
      this.ws.close()
      this.ws = undefined
    }

    // Clear callbacks
    this.stateCallbacks.clear()

    this.setConnectionState('disconnected')
  }

  // private methods

  private setConnectionState(state: IIIConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state
      for (const callback of this.stateCallbacks) {
        try {
          callback(state)
        } catch (error) {
          this.logError('Error in connection state callback', error)
        }
      }
    }
  }

  private connect(): void {
    if (this.isShuttingDown) {
      return
    }

    this.setConnectionState('connecting')
    this.ws = new WebSocket(this.address)
    this.ws.on('open', this.onSocketOpen.bind(this))
    this.ws.on('close', this.onSocketClose.bind(this))
    this.ws.on('error', this.onSocketError.bind(this))
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = undefined
    }
  }

  private scheduleReconnect(): void {
    if (this.isShuttingDown) {
      return
    }

    const { maxRetries, initialDelayMs, backoffMultiplier, maxDelayMs, jitterFactor } =
      this.reconnectionConfig

    if (maxRetries !== -1 && this.reconnectAttempt >= maxRetries) {
      this.setConnectionState('failed')
      this.logError(`Max reconnection retries (${maxRetries}) reached, giving up`)
      return
    }

    if (this.reconnectTimeout) {
      return // Already scheduled
    }

    const exponentialDelay = initialDelayMs * backoffMultiplier ** this.reconnectAttempt
    const cappedDelay = Math.min(exponentialDelay, maxDelayMs)
    const jitter = cappedDelay * jitterFactor * (2 * Math.random() - 1)
    const delay = Math.floor(cappedDelay + jitter)

    this.setConnectionState('reconnecting')
    console.debug(`[iii] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt + 1})...`)

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = undefined
      this.reconnectAttempt++
      this.connect()
    }, delay)
  }

  private onSocketError(error: Error): void {
    this.logError('WebSocket error', error)
  }

  private startMetricsReporting(): void {
    if (!this.metricsReportingEnabled || !this.workerId) {
      return
    }

    const meter = getMeter()
    if (!meter) {
      console.warn(
        '[iii] Worker metrics disabled: OpenTelemetry not initialized. Call initOtel() with metricsEnabled: true before creating the iii.',
      )
      return
    }

    registerWorkerGauges(meter, {
      workerId: this.workerId,
      workerName: this.workerName,
    })
  }

  private stopMetricsReporting(): void {
    stopWorkerGauges()
  }

  private onSocketClose(): void {
    this.ws?.removeAllListeners()
    this.ws?.terminate()
    this.ws = undefined

    this.setConnectionState('disconnected')
    this.stopMetricsReporting()
    this.scheduleReconnect()
  }

  private onSocketOpen(): void {
    this.clearReconnectTimeout()
    this.reconnectAttempt = 0
    this.setConnectionState('connected')

    this.ws?.on('message', this.onMessage.bind(this))

    this.triggerTypes.forEach(({ message }) => {
      this.sendMessage(MessageType.RegisterTriggerType, message, true)
    })
    this.services.forEach(service => {
      this.sendMessage(MessageType.RegisterService, service, true)
    })
    this.functions.forEach(({ message }) => {
      this.sendMessage(MessageType.RegisterFunction, message, true)
    })
    this.httpFunctions.forEach(message => {
      this.sendMessage(MessageType.RegisterFunction, message, true)
    })
    this.triggers.forEach(trigger => {
      this.sendMessage(MessageType.RegisterTrigger, trigger, true)
    })

    // Optimized: swap with empty array instead of splice
    const pending = this.messagesToSend
    this.messagesToSend = []
    for (const message of pending) {
      if (
        message.type === MessageType.InvokeFunction &&
        typeof message.invocation_id === 'string' &&
        !this.invocations.has(message.invocation_id)
      ) {
        continue
      }
      this.sendMessageRaw(JSON.stringify(message))
    }

    this.registerWorkerMetadata()
  }

  private isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private sendMessageRaw(data: string): void {
    if (this.ws && this.isOpen()) {
      try {
        this.ws.send(data, err => {
          if (err) {
            this.logError('Failed to send message', err)
          }
        })
      } catch (error) {
        this.logError('Exception while sending message', error)
      }
    }
  }

  private toWireFormat(
    messageType: MessageType,
    message: Omit<IIIMessage, 'message_type'>,
  ): Record<string, unknown> {
    const { message_type: _, ...rest } = message as Record<string, unknown>
    if (messageType === MessageType.RegisterTrigger && 'type' in message) {
      const { type: triggerType, ...triggerRest } = message as RegisterTriggerMessage
      return { type: messageType, ...triggerRest, trigger_type: triggerType }
    }
    if (messageType === MessageType.UnregisterTrigger && 'type' in message) {
      const { type: triggerType, ...triggerRest } = message as RegisterTriggerMessage
      return { type: messageType, ...triggerRest, trigger_type: triggerType }
    }
    if (messageType === MessageType.TriggerRegistrationResult && 'type' in message) {
      const { type: triggerType, ...resultRest } = message as TriggerRegistrationResultMessage
      return { type: messageType, ...resultRest, trigger_type: triggerType }
    }
    return { type: messageType, ...rest } as Record<string, unknown>
  }

  private sendMessage(
    messageType: MessageType,
    message: Omit<IIIMessage, 'message_type'>,
    skipIfClosed = false,
  ): void {
    const wireMessage = this.toWireFormat(messageType, message)
    if (this.isOpen()) {
      this.sendMessageRaw(JSON.stringify(wireMessage))
    } else if (!skipIfClosed) {
      this.messagesToSend.push(wireMessage)
    }
  }

  private logError(message: string, error?: unknown): void {
    const otelLogger = getLogger()
    const errorMessage = error instanceof Error ? error.message : String(error ?? '')

    if (otelLogger) {
      otelLogger.emit({
        severityNumber: SeverityNumber.ERROR,
        body: `[iii] ${message}${errorMessage ? `: ${errorMessage}` : ''}`,
      })
    } else {
      console.error(`[iii] ${message}`, error ?? '')
    }
  }

  private severityTextToNumber(level: LogSeverityLevel): number {
    switch (level) {
      case 'trace':
        return 1
      case 'debug':
        return 5
      case 'info':
        return 9
      case 'warn':
        return 13
      case 'error':
        return 17
      case 'fatal':
        return 21
      case 'all':
        return 0
      default:
        return 0
    }
  }

  private onInvocationResult(invocation_id: string, result: unknown, error: unknown): void {
    const invocation = this.invocations.get(invocation_id)

    if (invocation) {
      if (invocation.timeout) {
        clearTimeout(invocation.timeout)
      }
      error ? invocation.reject(error) : invocation.resolve(result)
    }

    this.invocations.delete(invocation_id)
  }

  private resolveChannelValue(value: unknown): unknown {
    if (isChannelRef(value)) {
      return value.direction === 'read'
        ? new ChannelReader(this.address, value)
        : new ChannelWriter(this.address, value)
    }
    if (Array.isArray(value)) {
      return value.map(item => this.resolveChannelValue(item))
    }
    if (value !== null && typeof value === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = this.resolveChannelValue(v)
      }
      return out
    }
    return value
  }

  private async onInvokeFunction<TInput>(
    invocation_id: string | undefined,
    function_id: string,
    input: TInput,
    traceparent?: string,
    baggage?: string,
  ): Promise<unknown> {
    const fn = this.functions.get(function_id)
    const getResponseTraceparent = () => injectTraceparent() ?? traceparent
    const getResponseBaggage = () => injectBaggage() ?? baggage

    const resolvedInput = this.resolveChannelValue(input) as TInput

    if (fn) {
      if (!invocation_id) {
        try {
          await fn.handler(resolvedInput, traceparent, baggage)
        } catch (error) {
          this.logError(`Error invoking function ${function_id}`, error)
        }
        return
      }

      try {
        const result = await fn.handler(resolvedInput, traceparent, baggage)
        this.sendMessage(MessageType.InvocationResult, {
          invocation_id,
          function_id,
          result,
          traceparent: getResponseTraceparent(),
          baggage: getResponseBaggage(),
        })
      } catch (error) {
        this.sendMessage(MessageType.InvocationResult, {
          invocation_id,
          function_id,
          error: { code: 'invocation_failed', message: (error as Error).message },
          traceparent: getResponseTraceparent(),
          baggage: getResponseBaggage(),
        })
      }
    } else {
      this.sendMessage(MessageType.InvocationResult, {
        invocation_id,
        function_id,
        error: { code: 'function_not_found', message: 'Function not found' },
        traceparent,
        baggage,
      })
    }
  }

  private async onRegisterTrigger(message: {
    trigger_type: string
    id: string
    function_id: string
    config: unknown
  }) {
    const { trigger_type, id, function_id, config } = message
    const triggerTypeData = this.triggerTypes.get(trigger_type)

    if (triggerTypeData) {
      try {
        await triggerTypeData.handler.registerTrigger({ id, function_id, config })
        this.sendMessage(MessageType.TriggerRegistrationResult, {
          id,
          message_type: MessageType.TriggerRegistrationResult,
          type: trigger_type,
          function_id,
        })
      } catch (error) {
        this.sendMessage(MessageType.TriggerRegistrationResult, {
          id,
          message_type: MessageType.TriggerRegistrationResult,
          type: trigger_type,
          function_id,
          error: { code: 'trigger_registration_failed', message: (error as Error).message },
        })
      }
    } else {
      this.sendMessage(MessageType.TriggerRegistrationResult, {
        id,
        message_type: MessageType.TriggerRegistrationResult,
        type: trigger_type,
        function_id,
        error: { code: 'trigger_type_not_found', message: 'Trigger type not found' },
      })
    }
  }

  private onMessage(socketMessage: Data): void {
    let msgType: MessageType
    let message: Record<string, unknown>

    try {
      const parsed = JSON.parse(socketMessage.toString()) as Record<string, unknown>
      msgType = parsed.type as MessageType
      const { type: _, ...rest } = parsed
      message = rest
    } catch (error) {
      this.logError('Failed to parse incoming message', error)
      return
    }

    if (msgType === MessageType.InvocationResult) {
      const { invocation_id, result, error } = message as InvocationResultMessage
      this.onInvocationResult(invocation_id, result, error)
    } else if (msgType === MessageType.InvokeFunction) {
      const { invocation_id, function_id, data, traceparent, baggage } =
        message as InvokeFunctionMessage
      this.onInvokeFunction(invocation_id, function_id, data, traceparent, baggage)
    } else if (msgType === MessageType.RegisterTrigger) {
      this.onRegisterTrigger(
        message as { trigger_type: string; id: string; function_id: string; config: unknown },
      )
    } else if (msgType === MessageType.WorkerRegistered) {
      const { worker_id } = message as WorkerRegisteredMessage
      this.workerId = worker_id
      console.debug('[iii] Worker registered with ID:', worker_id)
      this.startMetricsReporting()
    }
  }
}

export const init = (address: string, options?: InitOptions): ISdk => new Sdk(address, options)
