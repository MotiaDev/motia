import { jest } from '@jest/globals'

type MockFn<T = unknown> = jest.Mock<(...args: unknown[]) => T>

export interface MockRedisClient {
  connect: MockFn<Promise<void>>
  quit: MockFn<Promise<void>>
  disconnect: MockFn<Promise<void>>
  isOpen: boolean
  on: MockFn
  get: MockFn<Promise<string | null>>
  set: MockFn<Promise<string | null>>
  del: MockFn<Promise<number>>
  exists: MockFn<Promise<number>>
  keys: MockFn<Promise<string[]>>
  flushAll: MockFn<Promise<string>>
  ping: MockFn<Promise<string>>
  xAdd: MockFn<Promise<string>>
  xRead: MockFn<Promise<unknown[]>>
  xReadGroup: MockFn<Promise<unknown[]>>
  xGroupCreate: MockFn<Promise<string>>
  xAck: MockFn<Promise<number>>
  hGet: MockFn<Promise<string | null>>
  hSet: MockFn<Promise<number>>
  hGetAll: MockFn<Promise<Record<string, string>>>
  hDel: MockFn<Promise<number>>
  hExists: MockFn<Promise<number>>
  expire: MockFn<Promise<number>>
  ttl: MockFn<Promise<number>>
  publish: MockFn<Promise<number>>
  [key: string]: unknown
}

export interface RedisTestHelperOptions {
  autoConnect?: boolean
  isOpen?: boolean
}

export function createMockRedisClient(options: RedisTestHelperOptions = {}): MockRedisClient {
  const { autoConnect = true, isOpen = true } = options

  const mockClient: MockRedisClient = {
    connect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    quit: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    disconnect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    isOpen,
    on: jest.fn(),
    get: jest.fn<() => Promise<string | null>>().mockResolvedValue(null),
    set: jest.fn<() => Promise<string | null>>().mockResolvedValue('OK'),
    del: jest.fn<() => Promise<number>>().mockResolvedValue(1),
    exists: jest.fn<() => Promise<number>>().mockResolvedValue(1),
    keys: jest.fn<() => Promise<string[]>>().mockResolvedValue([]),
    flushAll: jest.fn<() => Promise<string>>().mockResolvedValue('OK'),
    ping: jest.fn<() => Promise<string>>().mockResolvedValue('PONG'),
    xAdd: jest.fn<() => Promise<string>>().mockResolvedValue(''),
    xRead: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
    xReadGroup: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
    xGroupCreate: jest.fn<() => Promise<string>>().mockResolvedValue('OK'),
    xAck: jest.fn<() => Promise<number>>().mockResolvedValue(1),
    hGet: jest.fn<() => Promise<string | null>>().mockResolvedValue(null),
    hSet: jest.fn<() => Promise<number>>().mockResolvedValue(1),
    hGetAll: jest.fn<() => Promise<Record<string, string>>>().mockResolvedValue({}),
    hDel: jest.fn<() => Promise<number>>().mockResolvedValue(1),
    hExists: jest.fn<() => Promise<number>>().mockResolvedValue(0),
    expire: jest.fn<() => Promise<number>>().mockResolvedValue(1),
    ttl: jest.fn<() => Promise<number>>().mockResolvedValue(-1),
    publish: jest.fn<() => Promise<number>>().mockResolvedValue(0),
  }

  if (autoConnect) {
    mockClient.connect.mockResolvedValue(undefined)
  }

  return mockClient
}

export function resetMockRedisClient(client: MockRedisClient): void {
  Object.keys(client).forEach((key) => {
    const value = client[key]
    if (typeof value === 'function' && 'mockClear' in value) {
      ;(value as MockFn).mockClear()
    }
  })
}

export function setupRedisTestHelper(): {
  mockClient: MockRedisClient
  reset: () => void
} {
  const mockClient = createMockRedisClient()

  return {
    mockClient,
    reset: () => resetMockRedisClient(mockClient),
  }
}

export class RedisTestHelper {
  private client: MockRedisClient

  constructor(options: RedisTestHelperOptions = {}) {
    this.client = createMockRedisClient(options)
  }

  getClient(): MockRedisClient {
    return this.client
  }

  reset(): void {
    resetMockRedisClient(this.client)
  }

  mockGet(key: string, value: string | null): void {
    this.client.get.mockImplementation((k: unknown) => {
      if (k === key) {
        return Promise.resolve(value)
      }
      return Promise.resolve(null)
    })
  }

  mockSet(_key: string, _value: string): void {
    this.client.set.mockResolvedValue('OK')
  }

  mockExists(key: string, exists: boolean): void {
    this.client.exists.mockImplementation((k: unknown) => {
      if (k === key) {
        return Promise.resolve(exists ? 1 : 0)
      }
      return Promise.resolve(0)
    })
  }

  mockKeys(_pattern: string, keys: string[]): void {
    this.client.keys.mockResolvedValue(keys)
  }

  mockConnectError(error: Error): void {
    this.client.connect.mockRejectedValue(error)
  }

  mockQuitError(error: Error): void {
    this.client.quit.mockRejectedValue(error)
  }

  setConnectionState(isOpen: boolean): void {
    Object.defineProperty(this.client, 'isOpen', {
      value: isOpen,
      writable: true,
      configurable: true,
    })
  }
}
