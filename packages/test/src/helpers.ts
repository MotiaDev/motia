import { Logger } from '@motiadev/core'
import type { RedisClientType } from 'redis'
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
  ;(Logger as jest.MockedClass<typeof Logger>).mockImplementation(createMockLogger)
}

export const createMockRedisClient = (): RedisClientType => {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    isOpen: true,
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    flushAll: jest.fn().mockResolvedValue('OK'),
    ping: jest.fn().mockResolvedValue('PONG'),
    xAdd: jest.fn().mockResolvedValue(''),
    xRead: jest.fn().mockResolvedValue([]),
    xReadGroup: jest.fn().mockResolvedValue([]),
    xGroupCreate: jest.fn().mockResolvedValue('OK'),
    xAck: jest.fn().mockResolvedValue(1),
    hGet: jest.fn().mockResolvedValue(null),
    hSet: jest.fn().mockResolvedValue(1),
    hGetAll: jest.fn().mockResolvedValue({}),
    hDel: jest.fn().mockResolvedValue(1),
    hExists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    publish: jest.fn().mockResolvedValue(0),
  } as unknown as RedisClientType
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
