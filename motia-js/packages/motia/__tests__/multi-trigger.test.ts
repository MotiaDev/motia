import { multiTriggerStep } from '../src/multi-trigger'
import { api, cron, queue } from '../src/triggers'

describe('multiTriggerStep', () => {
  const config = {
    name: 'multi-step',
    triggers: [queue('tasks'), api('GET', '/test'), cron('0 * * * *')],
  }

  it('returns builder with onQueue, onHttp, onCron methods', () => {
    const builder = multiTriggerStep(config)
    expect(builder.config).toEqual(config)
    expect(typeof builder.onQueue).toBe('function')
    expect(typeof builder.onHttp).toBe('function')
    expect(typeof builder.onCron).toBe('function')
    expect(typeof builder.handlers).toBe('function')
  })

  it('onQueue(handler).handlers() routes queue triggers to queue handler', async () => {
    const queueHandler = jest.fn().mockResolvedValue(undefined)
    const { handler } = multiTriggerStep(config).onQueue(queueHandler).handlers()
    const ctx = { trigger: { type: 'queue' }, logger: { warn: jest.fn() } }
    await handler({ data: 'test' }, ctx)
    expect(queueHandler).toHaveBeenCalledWith({ data: 'test' }, ctx)
  })

  it('onHttp(handler).handlers() routes http triggers to http handler', async () => {
    const httpHandler = jest.fn().mockResolvedValue({ status: 200, body: null })
    const { handler } = multiTriggerStep(config).onHttp(httpHandler).handlers()
    const ctx = { trigger: { type: 'http' }, logger: { warn: jest.fn() } }
    const req = { body: {}, pathParams: {}, queryParams: {}, headers: {} }
    await handler(req, ctx)
    expect(httpHandler).toHaveBeenCalledWith(req, ctx)
  })

  it('onCron(handler).handlers() routes cron triggers to cron handler', async () => {
    const cronHandler = jest.fn().mockResolvedValue(undefined)
    const { handler } = multiTriggerStep(config).onCron(cronHandler).handlers()
    const ctx = { trigger: { type: 'cron' }, logger: { warn: jest.fn() } }
    await handler(undefined, ctx)
    expect(cronHandler).toHaveBeenCalledWith(ctx)
  })

  it('handlers({ queue, http }) accepts all at once', async () => {
    const queueHandler = jest.fn().mockResolvedValue(undefined)
    const httpHandler = jest.fn().mockResolvedValue({ status: 200, body: null })
    const { handler } = multiTriggerStep(config).handlers({ queue: queueHandler, http: httpHandler })

    await handler({ data: 'q' }, { trigger: { type: 'queue' }, logger: { warn: jest.fn() } })
    expect(queueHandler).toHaveBeenCalled()

    await handler({ body: {} } as any, { trigger: { type: 'http' }, logger: { warn: jest.fn() } })
    expect(httpHandler).toHaveBeenCalled()
  })

  it('unified handler throws when no handler matches trigger type', async () => {
    const logger = { warn: jest.fn() }
    const { handler } = multiTriggerStep(config).onQueue(jest.fn()).handlers()
    const ctx = { trigger: { type: 'http' }, logger }

    await expect(handler({} as any, ctx)).rejects.toThrow(
      'No handler defined for trigger type: http. Available handlers: queue',
    )
  })

  it('unified handler logs warning before throwing', async () => {
    const logger = { warn: jest.fn() }
    const { handler } = multiTriggerStep(config).onQueue(jest.fn()).handlers()
    const ctx = { trigger: { type: 'cron' }, logger }

    await expect(handler(undefined, ctx)).rejects.toThrow()
    expect(logger.warn).toHaveBeenCalledWith('No handler defined for trigger type: cron', {
      availableHandlers: ['queue'],
      triggerType: 'cron',
    })
  })
})
