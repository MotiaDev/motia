import type { Event, FlowContext, InternalStateManager, Logger } from '@motiadev/core'
import type { Response } from 'supertest'

export type Watcher<TData = unknown> = {
  getCapturedEvents(): CapturedEvent<TData>[]
  getLastCapturedEvent(): CapturedEvent<TData> | undefined
  getCapturedEvent(index: number): CapturedEvent<TData> | undefined
}

export interface MotiaTester {
  post(path: string, options: RequestOptions): Promise<Response>
  get(path: string, options: RequestOptions): Promise<Response>
  emit(event: Event): Promise<void>
  watch<TData>(event: string): Promise<Watcher<TData>>
  sleep(ms: number): Promise<void>
  close(): Promise<void>
  waitEvents(): Promise<void>
  logger: Logger
}

export type RequestOptions = {
  body?: Record<string, unknown>
  headers?: Record<string, string>
  cookies?: Record<string, string>
}

export type CapturedEvent<TData = unknown> = Omit<Event<TData>, 'logger' | 'tracer'>

export type MockFlowContext = {
  logger: jest.Mocked<Logger>
  emit: jest.Mock | FlowContext<unknown>['emit']
  traceId: string
  state: jest.Mocked<InternalStateManager>
}

export interface MockLogger {
  info: (message: string) => void
  debug: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
  log: (message: string) => void
}
