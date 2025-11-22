export interface MockRedisClient {
  connect: jest.Mock<Promise<void>>
  quit: jest.Mock<Promise<void>>
  disconnect: jest.Mock<Promise<void>>
  isOpen: boolean
  on: jest.Mock
  get: jest.Mock<Promise<string | null>>
  set: jest.Mock<Promise<string | null>>
  del: jest.Mock<Promise<number>>
  exists: jest.Mock<Promise<number>>
  keys: jest.Mock<Promise<string[]>>
  flushAll: jest.Mock<Promise<string>>
  ping: jest.Mock<Promise<string>>
  xAdd: jest.Mock<Promise<string>>
  xRead: jest.Mock<Promise<unknown[]>>
  xReadGroup: jest.Mock<Promise<unknown[]>>
  xGroupCreate: jest.Mock<Promise<string>>
  xAck: jest.Mock<Promise<number>>
  hGet: jest.Mock<Promise<string | null>>
  hSet: jest.Mock<Promise<number>>
  hGetAll: jest.Mock<Promise<Record<string, string>>>
  hDel: jest.Mock<Promise<number>>
  hExists: jest.Mock<Promise<number>>
  expire: jest.Mock<Promise<number>>
  ttl: jest.Mock<Promise<number>>
  publish: jest.Mock<Promise<number>>
  [key: string]: unknown
}

export interface RedisTestHelperOptions {
  autoConnect?: boolean
  isOpen?: boolean
}

export function createMockRedisClient(options: RedisTestHelperOptions = {}): MockRedisClient {
  const { autoConnect = true, isOpen = true } = options

  const mockClient: MockRedisClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    isOpen,
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
  }

  if (autoConnect) {
    mockClient.connect.mockResolvedValue(undefined)
  }

  return mockClient
}

export function resetMockRedisClient(client: MockRedisClient): void {
  Object.keys(client).forEach((key) => {
    if (jest.isMockFunction(client[key])) {
      client[key].mockClear()
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
    this.client.get.mockImplementation((k: string) => {
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
    this.client.exists.mockImplementation((k: string) => {
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
