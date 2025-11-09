import { DefaultLoggerAdapter, type Logger } from '@motiadev/core'
import type { MockFlowContext, MockLogger } from './types'

export const createMockLogger = () => {
  const mockLogger: MockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  }
  return mockLogger as jest.Mocked<Logger>
}

export const setupLoggerMock = () => {
  ;(DefaultLoggerAdapter as jest.MockedClass<typeof DefaultLoggerAdapter>).mockImplementation(
    () =>
      ({
        isVerbose: false,
        createLogger: jest.fn(() => createMockLogger()),
      }) as unknown as DefaultLoggerAdapter,
  )
}

export const createMockContext = (options?: {
  logger?: jest.Mocked<Logger>
  emit?: jest.Mock
  traceId?: string
  state?: Partial<MockFlowContext['state']>
}): MockFlowContext => {
  const { logger = createMockLogger(), emit = jest.fn(), traceId = 'mock-trace-id', state } = options || {}

  return {
    logger,
    emit,
    traceId,
    state: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      getGroup: jest.fn(),
      ...state,
    },
  }
}
