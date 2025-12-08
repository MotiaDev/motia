import { jest } from '@jest/globals'

// Set up mocks before importing modules
const mockMkdirSync = jest.fn()
jest.unstable_mockModule('fs', () => ({
  mkdirSync: mockMkdirSync,
}))

const mockCreateClient = jest.fn()
jest.unstable_mockModule('redis', () => ({
  createClient: mockCreateClient,
}))

const MockRedisMemoryServer = jest.fn()
jest.unstable_mockModule('redis-memory-server', () => ({
  RedisMemoryServer: MockRedisMemoryServer,
}))

// Dynamic imports after mocks are set up
const { instanceRedisMemoryServer, stopRedisMemoryServer } = await import('../redis-memory-manager')

describe('redis-memory-manager', () => {
  let mockRedisClient: {
    connect: jest.Mock<() => Promise<void>>
    quit: jest.Mock<() => Promise<void>>
    isOpen: boolean
    on: jest.Mock
  }
  let mockServerInstance: {
    getHost: jest.Mock<() => Promise<string>>
    getPort: jest.Mock<() => Promise<number>>
    stop: jest.Mock<() => Promise<void>>
  }
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }

    mockRedisClient = {
      connect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      quit: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      isOpen: true,
      on: jest.fn(),
    }

    mockServerInstance = {
      getHost: jest.fn<() => Promise<string>>().mockResolvedValue('127.0.0.1'),
      getPort: jest.fn<() => Promise<number>>().mockResolvedValue(6379),
      stop: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    }

    mockCreateClient.mockReturnValue(mockRedisClient)
    MockRedisMemoryServer.mockImplementation(() => mockServerInstance)
  })

  afterEach(async () => {
    await stopRedisMemoryServer()
    process.env = originalEnv
  })

  describe('instanceRedisMemoryServer', () => {
    it('should start Redis server and return client', async () => {
      const baseDir = '/test/dir'
      const client = await instanceRedisMemoryServer(baseDir, true)

      expect(mockMkdirSync).toHaveBeenCalledWith(baseDir, { recursive: true })
      expect(MockRedisMemoryServer).toHaveBeenCalledWith({
        instance: {
          ip: '127.0.0.1',
          args: ['--appendonly', 'yes', '--save', '900 1', '--save', '300 10', '--save', '60 100', '--dir', baseDir],
        },
        autoStart: true,
      })
      expect(mockServerInstance.getHost).toHaveBeenCalled()
      expect(mockServerInstance.getPort).toHaveBeenCalled()
      expect(mockCreateClient).toHaveBeenCalledWith({
        socket: {
          host: '127.0.0.1',
          port: 6379,
          reconnectStrategy: expect.any(Function),
          connectTimeout: 10000,
          keepAlive: true,
          noDelay: true,
        },
      })
      expect(mockRedisClient.connect).toHaveBeenCalled()
      expect(client).toBe(mockRedisClient)
    })

    it('should use custom host from environment variable', async () => {
      process.env.MOTIA_REDIS_HOST = '192.168.1.1'
      const baseDir = '/test/dir'

      await instanceRedisMemoryServer(baseDir, false)

      expect(MockRedisMemoryServer).toHaveBeenCalledWith({
        instance: expect.objectContaining({
          ip: '192.168.1.1',
        }),
        autoStart: false,
      })
    })

    it('should use custom port from environment variable', async () => {
      process.env.MOTIA_REDIS_PORT = '6380'
      const baseDir = '/test/dir'

      await instanceRedisMemoryServer(baseDir, true)

      expect(MockRedisMemoryServer).toHaveBeenCalledWith({
        instance: expect.objectContaining({
          port: 6380,
        }),
        autoStart: true,
      })
    })

    it('should return existing client if already running', async () => {
      const baseDir = '/test/dir'
      const client1 = await instanceRedisMemoryServer(baseDir, true)
      const client2 = await instanceRedisMemoryServer(baseDir, false)

      expect(client1).toBe(client2)
      expect(MockRedisMemoryServer).toHaveBeenCalledTimes(1)
      expect(mockCreateClient).toHaveBeenCalledTimes(1)
    })

    it('should set up error handler on client', async () => {
      const baseDir = '/test/dir'
      await instanceRedisMemoryServer(baseDir, true)

      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should handle connection errors', async () => {
      const baseDir = '/test/dir'
      const error = new Error('Connection failed')
      mockRedisClient.connect = jest.fn<() => Promise<void>>().mockRejectedValue(error)
      mockCreateClient.mockReturnValue(mockRedisClient)

      await expect(instanceRedisMemoryServer(baseDir, true)).rejects.toThrow('Connection failed')
    })

    it('should handle server start errors', async () => {
      const baseDir = '/test/dir'
      const error = new Error('Server start failed')
      mockServerInstance.getHost = jest.fn<() => Promise<string>>().mockRejectedValue(error)

      await expect(instanceRedisMemoryServer(baseDir, true)).rejects.toThrow('Server start failed')
    })

    it('should implement reconnect strategy correctly', async () => {
      const baseDir = '/test/dir'
      await instanceRedisMemoryServer(baseDir, true)

      const callArgs = mockCreateClient.mock.calls[0] as [
        { socket: { reconnectStrategy: (retries: number) => number | Error } },
      ]
      expect(callArgs).toBeDefined()
      const socketConfig = callArgs?.[0]?.socket
      expect(socketConfig).toBeDefined()
      const reconnectStrategy = socketConfig?.reconnectStrategy
      expect(reconnectStrategy).toBeDefined()
      expect(typeof reconnectStrategy).toBe('function')

      const strategyFn = reconnectStrategy as (retries: number) => number | Error
      expect(strategyFn(5)).toBe(500)
      expect(strategyFn(10)).toBe(1000)
      expect(strategyFn(11)).toBeInstanceOf(Error)
      expect((strategyFn(11) as Error).message).toBe('Redis connection retry limit exceeded')
      expect(strategyFn(15)).toBeInstanceOf(Error)
      expect(strategyFn(20)).toBeInstanceOf(Error)
      expect(strategyFn(30)).toBeInstanceOf(Error)
      expect(strategyFn(50)).toBeInstanceOf(Error)
    })
  })

  describe('stopRedisMemoryServer', () => {
    it('should stop Redis server and close client', async () => {
      const baseDir = '/test/dir'
      await instanceRedisMemoryServer(baseDir, true)

      await stopRedisMemoryServer()

      expect(mockRedisClient.quit).toHaveBeenCalled()
      expect(mockServerInstance.stop).toHaveBeenCalled()
    })

    it('should handle client close errors gracefully', async () => {
      const baseDir = '/test/dir'
      await instanceRedisMemoryServer(baseDir, true)
      const error = new Error('Close failed')
      mockRedisClient.quit = jest.fn<() => Promise<void>>().mockRejectedValue(error)

      await stopRedisMemoryServer()

      expect(mockRedisClient.quit).toHaveBeenCalled()
      expect(mockServerInstance.stop).toHaveBeenCalled()
    })

    it('should handle server stop errors gracefully', async () => {
      const baseDir = '/test/dir'
      await instanceRedisMemoryServer(baseDir, true)
      const error = new Error('Stop failed')
      mockServerInstance.stop = jest.fn<() => Promise<void>>().mockRejectedValue(error)

      await stopRedisMemoryServer()

      expect(mockRedisClient.quit).toHaveBeenCalled()
      expect(mockServerInstance.stop).toHaveBeenCalled()
    })

    it('should not throw if client is not open', async () => {
      const baseDir = '/test/dir'
      await instanceRedisMemoryServer(baseDir, true)
      Object.defineProperty(mockRedisClient, 'isOpen', {
        value: false,
        writable: true,
        configurable: true,
      })

      await expect(stopRedisMemoryServer()).resolves.not.toThrow()
    })

    it('should do nothing if server is not running', async () => {
      await stopRedisMemoryServer()

      expect(mockRedisClient.quit).not.toHaveBeenCalled()
      expect(mockServerInstance.stop).not.toHaveBeenCalled()
    })
  })
})
