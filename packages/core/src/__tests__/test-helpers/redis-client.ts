import { jest } from '@jest/globals'
import type { RedisClientType } from 'redis'

export function createMockRedisClient(): RedisClientType {
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
