import { getInstance, initIII } from '../../src/new/iii'
import { sleep, initTestEnv, waitForReady } from './setup'

describe('bridge integration', () => {
  beforeAll(async () => {
    initTestEnv()
    initIII({ otel: { enabled: false } })
    const sdk = getInstance()
    await waitForReady(sdk)
  }, 15000)

  afterAll(async () => {
    const sdk = getInstance()
    await sdk.shutdown()
  })

  it('connects and registers function', async () => {
    const sdk = getInstance()
    const functionId = `test.echo.${Date.now()}`

    sdk.registerFunction({ id: functionId }, async (data: unknown) => {
      return { status_code: 200, body: { echoed: data } }
    })

    await sleep(500)

    const result = (await sdk.call(functionId, { message: 'hello' })) as
      | { echoed?: { message?: string } }
      | { body?: { echoed?: { message?: string } } }
    expect(result).toBeDefined()
    const echoed = 'echoed' in result ? result.echoed : result.body?.echoed
    expect(echoed?.message).toBe('hello')
  }, 10000)

  it('fire-and-forget invocation via callVoid', async () => {
    const sdk = getInstance()
    const functionId = `test.receiver.${Date.now()}`
    let received: unknown = null

    sdk.registerFunction({ id: functionId }, async (data: unknown) => {
      received = data
      return {}
    })

    await sleep(500)

    sdk.callVoid(functionId, { value: 42 })
    await sleep(1000)

    expect(received).toEqual(expect.objectContaining({ value: 42 }))
  }, 10000)

  it('list registered functions', async () => {
    const sdk = getInstance()
    const func1 = `test.list.func1.${Date.now()}`
    const func2 = `test.list.func2.${Date.now()}`

    sdk.registerFunction({ id: func1 }, async () => ({}))
    sdk.registerFunction({ id: func2 }, async () => ({}))

    await sleep(500)

    const result = (await sdk.call('engine::functions::list', {})) as { functions?: { function_id: string }[] }
    const ids = result?.functions?.map((f) => f.function_id) ?? []
    expect(ids).toContain(func1)
    expect(ids).toContain(func2)
  }, 10000)

  it('invoke non-existent function rejects or returns error', async () => {
    const sdk = getInstance()
    try {
      const result = await sdk.call('nonexistent.function.xyz', {})
      const hasError = result && typeof result === 'object' && ('error' in result || 'message' in result)
      expect(hasError || result === undefined).toBe(true)
    } catch (e) {
      expect(e).toBeDefined()
    }
  }, 5000)
})
