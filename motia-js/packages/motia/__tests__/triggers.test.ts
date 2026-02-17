import { api, cron, queue, state, stream } from '../src/triggers'

describe('triggers', () => {
  describe('api', () => {
    it('returns http trigger with method and path', () => {
      const t = api('GET', '/users')
      expect(t.type).toBe('http')
      expect(t.method).toBe('GET')
      expect(t.path).toBe('/users')
    })

    it('spreads bodySchema, responseSchema, queryParams, middleware from options', () => {
      const bodySchema = { type: 'object' as const }
      const responseSchema = { 200: { type: 'object' as const } }
      const queryParams = [{ name: 'q', required: true }] as const
      const middleware = [jest.fn()] as const
      const t = api('POST', '/items', {
        bodySchema,
        responseSchema,
        queryParams,
        middleware,
      })
      expect(t.bodySchema).toEqual(bodySchema)
      expect(t.responseSchema).toEqual(responseSchema)
      expect(t.queryParams).toEqual(queryParams)
      expect(t.middleware).toEqual(middleware)
    })

    it('includes condition when provided', () => {
      const condition = jest.fn()
      const t = api('GET', '/test', undefined, condition)
      expect(t.condition).toBe(condition)
    })
  })

  describe('queue', () => {
    it('returns queue trigger with topic', () => {
      const t = queue('orders')
      expect(t.type).toBe('queue')
      expect(t.topic).toBe('orders')
    })

    it('spreads input and infrastructure from options', () => {
      const input = { type: 'object' as const }
      const infrastructure = { maxRetries: 3 }
      const t = queue('tasks', { input, infrastructure })
      expect(t.input).toEqual(input)
      expect(t.infrastructure).toEqual(infrastructure)
    })

    it('includes condition when provided', () => {
      const condition = jest.fn()
      const t = queue('events', undefined, condition)
      expect(t.condition).toBe(condition)
    })
  })

  describe('cron', () => {
    it('returns cron trigger with expression', () => {
      const t = cron('0 * * * *')
      expect(t.type).toBe('cron')
      expect(t.expression).toBe('0 * * * *')
    })

    it('includes condition when provided', () => {
      const condition = jest.fn()
      const t = cron('0 0 * * *', condition)
      expect(t.condition).toBe(condition)
    })
  })

  describe('state', () => {
    it('returns state trigger', () => {
      const t = state()
      expect(t.type).toBe('state')
    })

    it('includes condition when provided', () => {
      const condition = jest.fn()
      const t = state(condition)
      expect(t.condition).toBe(condition)
    })
  })

  describe('stream', () => {
    it('returns stream trigger with streamName', () => {
      const t = stream('events')
      expect(t.type).toBe('stream')
      expect(t.streamName).toBe('events')
    })

    it('includes condition when provided', () => {
      const condition = jest.fn()
      const t = stream('messages', condition)
      expect(t.condition).toBe(condition)
    })
  })
})
