import { formatDuration } from '../utils'

describe('formatDuration', () => {
  describe('milliseconds', () => {
    it('should format values under 1 second as milliseconds', () => {
      expect(formatDuration(0)).toBe('0ms')
      expect(formatDuration(1)).toBe('1ms')
      expect(formatDuration(250)).toBe('250ms')
      expect(formatDuration(500)).toBe('500ms')
      expect(formatDuration(999)).toBe('999ms')
    })
  })

  describe('seconds', () => {
    it('should format values between 1 second and 1 minute as seconds with 1 decimal', () => {
      expect(formatDuration(1000)).toBe('1.0s')
      expect(formatDuration(1500)).toBe('1.5s')
      expect(formatDuration(15000)).toBe('15.0s')
      expect(formatDuration(45500)).toBe('45.5s')
      expect(formatDuration(59999)).toBe('60.0s')
    })

    it('should round to 1 decimal place', () => {
      expect(formatDuration(1234)).toBe('1.2s')
      expect(formatDuration(1567)).toBe('1.6s')
      expect(formatDuration(12345)).toBe('12.3s')
    })
  })

  describe('minutes', () => {
    it('should format values between 1 minute and 1 hour as minutes with 1 decimal', () => {
      expect(formatDuration(60000)).toBe('1.0min')
      expect(formatDuration(90000)).toBe('1.5min')
      expect(formatDuration(300000)).toBe('5.0min')
      expect(formatDuration(1800000)).toBe('30.0min')
      expect(formatDuration(3599999)).toBe('60.0min')
    })

    it('should round to 1 decimal place', () => {
      expect(formatDuration(123456)).toBe('2.1min')
      expect(formatDuration(567890)).toBe('9.5min')
    })
  })

  describe('hours', () => {
    it('should format values 1 hour or more as hours with 1 decimal', () => {
      expect(formatDuration(3600000)).toBe('1.0h')
      expect(formatDuration(5400000)).toBe('1.5h')
      expect(formatDuration(7200000)).toBe('2.0h')
      expect(formatDuration(36000000)).toBe('10.0h')
    })

    it('should round to 1 decimal place', () => {
      expect(formatDuration(3661000)).toBe('1.0h')
      expect(formatDuration(5432100)).toBe('1.5h')
      expect(formatDuration(9000000)).toBe('2.5h')
    })
  })

  describe('edge cases', () => {
    it('should return "N/A" for undefined', () => {
      expect(formatDuration(undefined)).toBe('N/A')
    })

    it('should return "N/A" for null', () => {
      expect(formatDuration(null as any)).toBe('N/A')
    })

    it('should return "N/A" for 0 when treated as falsy', () => {
      expect(formatDuration(0)).toBe('0ms')
    })
  })

  describe('boundary values', () => {
    it('should correctly handle millisecond-second boundary (999ms vs 1.0s)', () => {
      expect(formatDuration(999)).toBe('999ms')
      expect(formatDuration(1000)).toBe('1.0s')
    })

    it('should correctly handle second-minute boundary (59.9s vs 1.0min)', () => {
      expect(formatDuration(59999)).toBe('60.0s')
      expect(formatDuration(60000)).toBe('1.0min')
    })

    it('should correctly handle minute-hour boundary (59.9min vs 1.0h)', () => {
      expect(formatDuration(3599999)).toBe('60.0min')
      expect(formatDuration(3600000)).toBe('1.0h')
    })
  })

  describe('real-world scenarios', () => {
    it('should format typical API response times', () => {
      expect(formatDuration(50)).toBe('50ms')
      expect(formatDuration(150)).toBe('150ms')
      expect(formatDuration(2500)).toBe('2.5s')
    })

    it('should format typical workflow execution times', () => {
      expect(formatDuration(5000)).toBe('5.0s')
      expect(formatDuration(30000)).toBe('30.0s')
      expect(formatDuration(120000)).toBe('2.0min')
    })

    it('should format long-running tasks', () => {
      expect(formatDuration(600000)).toBe('10.0min')
      expect(formatDuration(1800000)).toBe('30.0min')
      expect(formatDuration(7200000)).toBe('2.0h')
    })
  })
})
