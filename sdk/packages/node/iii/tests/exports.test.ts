import { describe, expect, it } from 'vitest'
import { init, getContext, withContext, Logger } from '../src/index'
import { initOtel, shutdownOtel, getTracer, getMeter, getLogger } from '../src/telemetry'

describe('Package Exports', () => {
  it('should export main SDK symbols', () => {
    expect(init).toBeDefined()
    expect(typeof init).toBe('function')
    expect(getContext).toBeDefined()
    expect(withContext).toBeDefined()
    expect(Logger).toBeDefined()
  })

  it('should import stream module', async () => {
    await expect(import('../src/stream')).resolves.toBeDefined()
  })

  it('should import state module', async () => {
    const stateModule = await import('../src/state')
    expect(stateModule).toBeDefined()
    expect(stateModule.StateEventType).toBeDefined()
    expect(Object.keys(stateModule).length).toBeGreaterThan(0)
  })

  it('should export telemetry utilities', () => {
    expect(initOtel).toBeDefined()
    expect(typeof initOtel).toBe('function')
    expect(shutdownOtel).toBeDefined()
    expect(typeof shutdownOtel).toBe('function')
    expect(getTracer).toBeDefined()
    expect(typeof getTracer).toBe('function')
    expect(getMeter).toBeDefined()
    expect(typeof getMeter).toBe('function')
    expect(getLogger).toBeDefined()
    expect(typeof getLogger).toBe('function')
  })
})
