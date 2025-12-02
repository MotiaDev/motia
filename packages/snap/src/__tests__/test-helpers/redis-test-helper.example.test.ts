import { createMockRedisClient, RedisTestHelper, setupRedisTestHelper } from './redis-test-helper'

describe('RedisTestHelper Usage Examples', () => {
  describe('using createMockRedisClient', () => {
    it('should create a mock Redis client', async () => {
      const mockClient = createMockRedisClient()

      expect(mockClient.isOpen).toBe(true)
      expect(mockClient.connect).toBeDefined()
      expect(mockClient.quit).toBeDefined()

      await mockClient.connect()
      expect(mockClient.connect).toHaveBeenCalledTimes(1)
    })

    it('should create a disconnected client', () => {
      const mockClient = createMockRedisClient({ isOpen: false })

      expect(mockClient.isOpen).toBe(false)
    })

    it('should mock Redis operations', async () => {
      const mockClient = createMockRedisClient()

      mockClient.get.mockResolvedValue('test-value')
      mockClient.set.mockResolvedValue('OK')

      const value = await mockClient.get('test-key')
      expect(value).toBe('test-value')

      const result = await mockClient.set('test-key', 'test-value')
      expect(result).toBe('OK')
    })
  })

  describe('using setupRedisTestHelper', () => {
    it('should provide reset functionality', () => {
      const { mockClient, reset } = setupRedisTestHelper()

      mockClient.get('key1')
      expect(mockClient.get).toHaveBeenCalledTimes(1)

      reset()
      expect(mockClient.get).toHaveBeenCalledTimes(0)
    })
  })

  describe('using RedisTestHelper class', () => {
    let helper: RedisTestHelper

    beforeEach(() => {
      helper = new RedisTestHelper()
    })

    afterEach(() => {
      helper.reset()
    })

    it('should provide convenient mock methods', async () => {
      const client = helper.getClient()

      helper.mockGet('user:123', 'John Doe')
      const value = await client.get('user:123')
      expect(value).toBe('John Doe')

      helper.mockExists('user:123', true)
      const exists = await client.exists('user:123')
      expect(exists).toBe(1)
    })

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed')
      helper.mockConnectError(error)

      const client = helper.getClient()
      await expect(client.connect()).rejects.toThrow('Connection failed')
    })

    it('should allow changing connection state', () => {
      const client = helper.getClient()
      expect(client.isOpen).toBe(true)

      helper.setConnectionState(false)
      expect(client.isOpen).toBe(false)
    })

    it('should mock keys operation', async () => {
      helper.mockKeys('user:*', ['user:1', 'user:2', 'user:3'])

      const client = helper.getClient()
      const keys = await client.keys('user:*')
      expect(keys).toEqual(['user:1', 'user:2', 'user:3'])
    })
  })

  describe('integration with RedisClientType', () => {
    it('should have required Redis client methods', () => {
      const mockClient = createMockRedisClient()

      expect(mockClient.connect).toBeDefined()
      expect(mockClient.quit).toBeDefined()
      expect(mockClient.isOpen).toBeDefined()
      expect(typeof mockClient.connect).toBe('function')
      expect(typeof mockClient.quit).toBe('function')
    })
  })
})
