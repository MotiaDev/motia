import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'

const mockPrettyPrint = jest.fn<(entry: Record<string, unknown>, compact: boolean) => void>()

jest.unstable_mockModule('../pretty-print', () => ({
  prettyPrint: mockPrettyPrint,
}))

describe('Logger', () => {
  let originalLogLevel: string | undefined

  beforeEach(() => {
    originalLogLevel = process.env.LOG_LEVEL
    mockPrettyPrint.mockClear()
    jest.resetModules()
  })

  afterEach(() => {
    if (originalLogLevel === undefined) {
      delete process.env.LOG_LEVEL
    } else {
      process.env.LOG_LEVEL = originalLogLevel
    }
  })

  describe('with default LOG_LEVEL (info)', () => {
    beforeEach(() => {
      delete process.env.LOG_LEVEL
    })

    it.each(['info', 'warn', 'error'] as const)('should log %s messages', async (level) => {
      const { Logger } = await import('../logger')
      const logger = new Logger()

      logger[level](`test ${level} message`)

      expect(mockPrettyPrint).toHaveBeenCalledWith(
        expect.objectContaining({ level, msg: `test ${level} message` }),
        expect.any(Boolean),
      )
    })

    it('should NOT log debug messages', async () => {
      const { Logger } = await import('../logger')
      const logger = new Logger()

      logger.debug('test debug message')

      expect(mockPrettyPrint).not.toHaveBeenCalled()
    })

    it('should filter debug logs via log() method', async () => {
      const { Logger } = await import('../logger')
      const logger = new Logger()

      logger.log({ level: 'debug', msg: 'debug via log method' })

      expect(mockPrettyPrint).not.toHaveBeenCalled()
    })

    it('should allow info logs via log() method', async () => {
      const { Logger } = await import('../logger')
      const logger = new Logger()

      logger.log({ level: 'info', msg: 'info via log method' })

      expect(mockPrettyPrint).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'info', msg: 'info via log method' }),
        expect.any(Boolean),
      )
    })
  })

  describe('with LOG_LEVEL=debug', () => {
    beforeEach(() => {
      process.env.LOG_LEVEL = 'debug'
    })

    it.each(['debug', 'info', 'warn', 'error'] as const)('should log %s messages', async (level) => {
      const { Logger } = await import('../logger')
      const logger = new Logger()

      logger[level](`test ${level} message`)

      expect(mockPrettyPrint).toHaveBeenCalledWith(
        expect.objectContaining({ level, msg: `test ${level} message` }),
        expect.any(Boolean),
      )
    })

    it('should allow debug logs via log() method', async () => {
      const { Logger } = await import('../logger')
      const logger = new Logger()

      logger.log({ level: 'debug', msg: 'debug via log method' })

      expect(mockPrettyPrint).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'debug', msg: 'debug via log method' }),
        expect.any(Boolean),
      )
    })
  })

  describe('log() method with RPC-style log entries', () => {
    it('should handle log entries from step handlers', async () => {
      delete process.env.LOG_LEVEL
      const { Logger } = await import('../logger')
      const logger = new Logger()

      const logEntry = {
        level: 'info',
        msg: 'Step handler message',
        traceId: 'abc123',
        flows: ['test-flow'],
      }

      logger.log(logEntry)

      expect(mockPrettyPrint).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          msg: 'Step handler message',
          traceId: 'abc123',
        }),
        expect.any(Boolean),
      )
    })

    it('should default to info level when level is not specified', async () => {
      delete process.env.LOG_LEVEL
      const { Logger } = await import('../logger')
      const logger = new Logger()

      logger.log({ msg: 'message without level' })

      expect(mockPrettyPrint).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'info', msg: 'message without level' }),
        expect.any(Boolean),
      )
    })
  })

  describe('runtime LOG_LEVEL evaluation', () => {
    it('should respect LOG_LEVEL changes at runtime', async () => {
      delete process.env.LOG_LEVEL
      const { Logger } = await import('../logger')
      const logger = new Logger()

      logger.debug('should not appear')
      expect(mockPrettyPrint).not.toHaveBeenCalled()

      process.env.LOG_LEVEL = 'debug'

      logger.debug('should appear now')
      expect(mockPrettyPrint).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'debug', msg: 'should appear now' }),
        expect.any(Boolean),
      )
    })
  })
})
