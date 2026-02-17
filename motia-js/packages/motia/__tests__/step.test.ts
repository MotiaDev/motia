import { api } from '../src/triggers'
import { step } from '../src/step'

describe('step', () => {
  const config = {
    name: 'test-step',
    triggers: [api('GET', '/test')],
  }

  it('step(config, handler) returns { config, handler }', () => {
    const handler = jest.fn()
    const result = step(config, handler)
    expect(result).toEqual({ config, handler })
  })

  it('step(config) returns builder with .handle method', () => {
    const result = step(config)
    expect(result.config).toEqual(config)
    expect(typeof result.handle).toBe('function')
  })

  it('builder .handle() returns { config, handler }', () => {
    const handler = jest.fn()
    const builder = step(config)
    const result = builder.handle(handler)
    expect(result.config).toEqual(config)
    expect(result.handler).toBe(handler)
  })
})
