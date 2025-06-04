import { ObservabilityEvent, Trace, TraceGroup, TraceStep } from '../../observability/types'
import { StateStream } from '../../state-stream'
import { BaseStreamItem } from '../../types-stream'

export const createMockObservabilityEvent = (overrides: Partial<ObservabilityEvent> = {}): ObservabilityEvent => ({
  eventType: 'step_start',
  traceId: 'test-trace-123',
  stepName: 'test-step',
  timestamp: Date.now(),
  ...overrides
})

export const createMockTrace = (overrides: Partial<Trace> = {}): Trace => ({
  id: 'test-trace-123',
  flowName: 'test-flow',
  status: 'running',
  startTime: Date.now(),
  entryPoint: { type: 'api', stepName: 'test-api-step' },
  steps: [],
  metadata: {
    totalSteps: 0,
    completedSteps: 0,
    errorCount: 0
  },
  ...overrides
})

export const createMockTraceStep = (overrides: Partial<TraceStep> = {}): TraceStep => ({
  name: 'test-step',
  status: 'waiting',
  operations: { state: 0, emit: 0, stream: 0 },
  ...overrides
})

export const createMockTraceGroup = (overrides: Partial<TraceGroup> = {}): TraceGroup => ({
  id: 'test-correlation-123',
  correlationId: 'test-correlation-123',
  name: 'Test Flow Group',
  status: 'active',
  startTime: Date.now(),
  lastActivity: Date.now(),
  traces: [],
  metadata: {
    totalTraces: 0,
    completedTraces: 0,
    activeTraces: 0,
    totalSteps: 0,
    averageStepDuration: 0,
    gapsCount: 0,
    totalGapDuration: 0
  },
  ...overrides
})

export class MockStateStream<T> extends StateStream<T> {
  private data = new Map<string, T>()
  private mockSend = jest.fn()

  get = async (groupId: string, id: string): Promise<BaseStreamItem<T> | null> => {
    const data = this.data.get(`${groupId}-${id}`)
    return data ? { id, ...data } as BaseStreamItem<T> : null
  }

  set = async (groupId: string, id: string, data: T): Promise<BaseStreamItem<T> | null> => {
    this.data.set(`${groupId}-${id}`, data)
    const streamItem = { id, ...data } as BaseStreamItem<T>
    await this.send({ groupId }, { type: 'test_event', data: streamItem })
    return streamItem
  }

  delete = async (groupId: string, id: string): Promise<BaseStreamItem<T> | null> => {
    const data = this.data.get(`${groupId}-${id}`)
    if (data) {
      this.data.delete(`${groupId}-${id}`)
      return { id, ...data } as BaseStreamItem<T>
    }
    return null
  }

  getGroup = async (groupId: string): Promise<BaseStreamItem<T>[]> => {
    const results: BaseStreamItem<T>[] = []
    for (const [key, value] of this.data.entries()) {
      if (key.startsWith(`${groupId}-`)) {
        const id = key.replace(`${groupId}-`, '')
        results.push({ id, ...value } as BaseStreamItem<T>)
      }
    }
    return results
  }

  clear = async (): Promise<void> => {
    this.data.clear()
  }

  send = this.mockSend

  getSendMock() {
    return this.mockSend
  }

  getData() {
    return this.data
  }
}

export class MockObservabilityStream extends StateStream<ObservabilityEvent> {
  private data = new Map<string, ObservabilityEvent>()
  private mockSend = jest.fn()

  get = async (): Promise<BaseStreamItem<ObservabilityEvent> | null> => null

  delete = async (): Promise<BaseStreamItem<ObservabilityEvent> | null> => null

  getGroup = async (): Promise<BaseStreamItem<ObservabilityEvent>[]> => []

  set = async (_: string, id: string, data: ObservabilityEvent): Promise<BaseStreamItem<ObservabilityEvent> | null> => {
    this.data.set(id, data)
    const streamItem: BaseStreamItem<ObservabilityEvent> = { ...data, id }
    await this.send({ groupId: 'observability' }, { type: 'observability_event', data: streamItem })
    return streamItem
  }

  send = this.mockSend

  getSendMock() {
    return this.mockSend
  }

  getData() {
    return this.data
  }
} 