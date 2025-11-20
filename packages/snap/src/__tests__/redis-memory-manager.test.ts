import { mkdirSync } from 'fs'
import { createClient } from 'redis'
import { RedisMemoryServer } from 'redis-memory-server'
import { instanceRedisMemoryServer, stopRedisMemoryServer } from '../redis-memory-manager'

jest.mock('fs')
jest.mock('redis')
jest.mock('redis-memory-server')

const mockMkdirSync = mkdirSync as jest.MockedFunction<typeof mkdirSync>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockRedisMemoryServer = RedisMemoryServer as jest.MockedClass<typeof RedisMemoryServer>

describe('redis-memory-manager', () => {
  let mockRedisClient: any
  let mockServerInstance: jest.Mocked<RedisMemoryServer>
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }

    mockRedisClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      isOpen: true,
      on: jest.fn(),
    }

    mockServerInstance = {
      getHost: jest.fn().mockResolvedValue('127.0.0.1'),
      getPort: jest.fn().mockResolvedValue(6379),
      stop: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<RedisMemoryServer>

    mockCreateClient.mockReturnValue(mockRedisClient as any)
    mockRedisMemoryServer.mockImplementation(() => mockServerInstance)
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
      expect(mockRedisMemoryServer).toHaveBeenCalledWith({
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
        },
      })
      expect(mockRedisClient.connect).toHaveBeenCalled()
      expect(client).toBe(mockRedisClient)
    })

    it('should use custom host from environment variable', async () => {
      process.env.MOTIA_REDIS_HOST = '192.168.1.1'
      const baseDir = '/test/dir'

      await instanceRedisMemoryServer(baseDir, false)

      expect(mockRedisMemoryServer).toHaveBeenCalledWith({
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

      expect(mockRedisMemoryServer).toHaveBeenCalledWith({
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
      expect(mockRedisMemoryServer).toHaveBeenCalledTimes(1)
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
      mockRedisClient.connect.mockRejectedValue(error)

      await expect(instanceRedisMemoryServer(baseDir, true)).rejects.toThrow('Connection failed')
    })

    it('should handle server start errors', async () => {
      const baseDir = '/test/dir'
      const error = new Error('Server start failed')
      mockServerInstance.getHost.mockRejectedValue(error)

      await expect(instanceRedisMemoryServer(baseDir, true)).rejects.toThrow('Server start failed')
    })

    it('should implement reconnect strategy correctly', async () => {
      const baseDir = '/test/dir'
      await instanceRedisMemoryServer(baseDir, true)

      const callArgs = mockCreateClient.mock.calls[0]
      expect(callArgs).toBeDefined()
      const socketConfig = callArgs?.[0]?.socket
      expect(socketConfig).toBeDefined()
      const reconnectStrategy = socketConfig?.reconnectStrategy
      expect(reconnectStrategy).toBeDefined()
      expect(typeof reconnectStrategy).toBe('function')

      const mockError = new Error('test')
      const strategyFn = reconnectStrategy as (retries: number, error: Error) => number | Error
      expect(strategyFn(5, mockError)).toBe(500)
      expect(strategyFn(10, mockError)).toBe(1000)
      expect(strategyFn(11, mockError)).toBeInstanceOf(Error)
      expect((strategyFn(11, mockError) as Error).message).toBe('Redis connection retry limit exceeded')
      expect(strategyFn(15, mockError)).toBeInstanceOf(Error)
      expect(strategyFn(20, mockError)).toBeInstanceOf(Error)
      expect(strategyFn(30, mockError)).toBeInstanceOf(Error)
      expect(strategyFn(50, mockError)).toBeInstanceOf(Error)
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
      mockRedisClient.quit.mockRejectedValue(error)

      await stopRedisMemoryServer()

      expect(mockRedisClient.quit).toHaveBeenCalled()
      expect(mockServerInstance.stop).toHaveBeenCalled()
    })

    it('should handle server stop errors gracefully', async () => {
      const baseDir = '/test/dir'
      await instanceRedisMemoryServer(baseDir, true)
      const error = new Error('Stop failed')
      mockServerInstance.stop.mockRejectedValue(error)

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
