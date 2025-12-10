import { jest } from '@jest/globals'

const mockMkdirSync = jest.fn()
jest.unstable_mockModule('fs', () => ({
  mkdirSync: mockMkdirSync,
}))

const MockRedisMemoryServer = jest.fn()
jest.unstable_mockModule('redis-memory-server', () => ({
  RedisMemoryServer: MockRedisMemoryServer,
}))

const { RedisMemoryManager } = await import('../redis/memory-manager')

describe('RedisMemoryManager', () => {
  let manager: InstanceType<typeof RedisMemoryManager>
  let mockServerInstance: {
    getHost: jest.Mock<() => Promise<string>>
    getPort: jest.Mock<() => Promise<number>>
    stop: jest.Mock<() => Promise<void>>
  }
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }

    mockServerInstance = {
      getHost: jest.fn<() => Promise<string>>().mockResolvedValue('127.0.0.1'),
      getPort: jest.fn<() => Promise<number>>().mockResolvedValue(6379),
      stop: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    }

    MockRedisMemoryServer.mockImplementation(() => mockServerInstance)
    manager = new RedisMemoryManager()
  })

  afterEach(async () => {
    await manager.stop()
    process.env = originalEnv
  })

  describe('startServer', () => {
    it('should start Redis server and return connection info', async () => {
      const baseDir = '/test/dir'
      const connectionInfo = await manager.startServer(baseDir)

      expect(mockMkdirSync).toHaveBeenCalledWith(baseDir, { recursive: true })
      expect(MockRedisMemoryServer).toHaveBeenCalledWith({
        instance: {
          args: ['--appendonly', 'yes', '--appendfsync', 'everysec', '--save', '""', '--dir', baseDir],
        },
      })
      expect(mockServerInstance.getHost).toHaveBeenCalled()
      expect(mockServerInstance.getPort).toHaveBeenCalled()
      expect(connectionInfo).toEqual({
        host: '127.0.0.1',
        port: 6379,
      })
    })

    it('should use custom port from environment variable', async () => {
      process.env.MOTIA_REDIS_PORT = '6380'
      const baseDir = '/test/dir'

      await manager.startServer(baseDir)

      expect(MockRedisMemoryServer).toHaveBeenCalledWith({
        instance: expect.objectContaining({
          port: 6380,
        }),
      })
    })

    it('should reuse existing server instance', async () => {
      const baseDir = '/test/dir'
      await manager.startServer(baseDir)
      await manager.startServer(baseDir)

      expect(MockRedisMemoryServer).toHaveBeenCalledTimes(1)
    })

    it('should handle server start errors', async () => {
      const baseDir = '/test/dir'
      const error = new Error('Server start failed')
      mockServerInstance.getHost = jest.fn<() => Promise<string>>().mockRejectedValue(error)

      await expect(manager.startServer(baseDir)).rejects.toThrow('Server start failed')
    })

    it('should return isRunning true after starting', async () => {
      const baseDir = '/test/dir'
      expect(manager.isRunning()).toBe(false)

      await manager.startServer(baseDir)

      expect(manager.isRunning()).toBe(true)
    })
  })

  describe('stop', () => {
    it('should stop Redis server', async () => {
      const baseDir = '/test/dir'
      await manager.startServer(baseDir)

      await manager.stop()

      expect(mockServerInstance.stop).toHaveBeenCalled()
      expect(manager.isRunning()).toBe(false)
    })

    it('should handle server stop errors gracefully', async () => {
      const baseDir = '/test/dir'
      await manager.startServer(baseDir)
      const error = new Error('Stop failed')
      mockServerInstance.stop = jest.fn<() => Promise<void>>().mockRejectedValue(error)

      await manager.stop()

      expect(mockServerInstance.stop).toHaveBeenCalled()
      expect(manager.isRunning()).toBe(false)
    })

    it('should do nothing if server is not running', async () => {
      await manager.stop()

      expect(mockServerInstance.stop).not.toHaveBeenCalled()
    })

    it('should handle multiple stop calls gracefully', async () => {
      const baseDir = '/test/dir'
      await manager.startServer(baseDir)

      await manager.stop()
      await manager.stop()

      expect(mockServerInstance.stop).toHaveBeenCalledTimes(1)
    })
  })

  describe('isRunning', () => {
    it('should return false initially', () => {
      expect(manager.isRunning()).toBe(false)
    })

    it('should return true after starting', async () => {
      const baseDir = '/test/dir'
      await manager.startServer(baseDir)

      expect(manager.isRunning()).toBe(true)
    })

    it('should return false after stopping', async () => {
      const baseDir = '/test/dir'
      await manager.startServer(baseDir)
      await manager.stop()

      expect(manager.isRunning()).toBe(false)
    })
  })

  describe('getClient', () => {
    it('should return null initially', () => {
      expect(manager.getClient()).toBeNull()
    })
  })
})
