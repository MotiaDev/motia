import { jest } from '@jest/globals'

const mockQuit = jest.fn<() => Promise<void>>().mockResolvedValue()
const mockConnect = jest.fn<() => Promise<void>>().mockResolvedValue()

jest.unstable_mockModule('redis', () => ({
  createClient: jest.fn(() => ({
    connect: mockConnect,
    quit: mockQuit,
    isOpen: true,
  })),
}))

const mockMemoryManagerStop = jest.fn<() => Promise<void>>().mockResolvedValue()
const mockStartServer = jest
  .fn<(baseDir: string) => Promise<{ host: string; port: number }>>()
  .mockResolvedValue({ host: '127.0.0.1', port: 6379 })

jest.unstable_mockModule('../redis/memory-manager', () => ({
  RedisMemoryManager: jest.fn().mockImplementation(() => ({
    startServer: mockStartServer,
    stop: mockMemoryManagerStop,
  })),
}))

const { stopRedisConnection, getRedisClient } = await import('../redis/connection')

describe('RedisConnectionManager integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should stop Redis memory server and quit client when stopping connection', async () => {
    const baseDir = '/test/dir'
    const config = {
      redis: {},
    } as any

    await getRedisClient(baseDir, config)

    await stopRedisConnection()

    expect(mockMemoryManagerStop).toHaveBeenCalled()
    expect(mockQuit).toHaveBeenCalled()
  })
})
