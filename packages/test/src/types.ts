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
}

export type CapturedEvent<TData = unknown> = Omit<Event<TData>, 'logger'>

export type MockFlowContext = {
  logger: jest.Mocked<Logger>
  emit: jest.Mock | FlowContext['emit']
  traceId: string
  state: jest.Mocked<InternalStateManager>
}
