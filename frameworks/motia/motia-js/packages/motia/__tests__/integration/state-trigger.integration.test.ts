import { getInstance, initIII } from '../../src/new/iii'
import { StateManager } from '../../src/new/state'
import { initTestEnv, sleep, waitForReady, waitForRegistration } from './setup'

describe('state trigger integration', () => {
  let state: StateManager

  beforeAll(async () => {
    initTestEnv()
    initIII({ enabled: false })
    const sdk = getInstance()
    await waitForReady(sdk)
    state = new StateManager()
  }, 15000)

  afterAll(async () => {
    const sdk = getInstance()
    await sdk.shutdown()
  })

  it('state set fires registered state trigger handler', async () => {
    const sdk = getInstance()
    const functionId = `test.state-trigger.set.${Date.now()}`
    let received: unknown = null

    sdk.registerFunction({ id: functionId }, async (data: unknown) => {
      received = data
    })
    sdk.registerTrigger({
      type: 'state',
      function_id: functionId,
      config: {},
    })

    await waitForRegistration(sdk, functionId)

    const scope = `trigger_scope_${Date.now()}`
    const key = `trigger_key_${Date.now()}`
    await state.set(scope, key, { value: 'hello' })
    await sleep(2000)

    expect(received).not.toBeNull()
  }, 15000)

  it('handler receives state change payload with group_id and item_id', async () => {
    const sdk = getInstance()
    const functionId = `test.state-trigger.payload.${Date.now()}`
    let received: unknown = null

    sdk.registerFunction({ id: functionId }, async (data: unknown) => {
      received = data
    })
    sdk.registerTrigger({
      type: 'state',
      function_id: functionId,
      config: {},
    })

    await waitForRegistration(sdk, functionId)

    const scope = `payload_scope_${Date.now()}`
    const key = `payload_key_${Date.now()}`
    await state.set(scope, key, { count: 42 })
    await sleep(2000)

    const payload = received as { type?: string; group_id?: string; item_id?: string; new_value?: unknown }
    expect(payload).toBeDefined()
    expect(payload?.type).toBe('state')
    expect(payload?.group_id).toBe(scope)
    expect(payload?.item_id).toBe(key)
    expect(payload?.new_value).toEqual({ count: 42 })
  }, 15000)

  it('state update fires handler with updated data', async () => {
    const sdk = getInstance()
    const functionId = `test.state-trigger.update.${Date.now()}`
    const received: unknown[] = []

    sdk.registerFunction({ id: functionId }, async (data: unknown) => {
      received.push(data)
    })
    sdk.registerTrigger({
      type: 'state',
      function_id: functionId,
      config: {},
    })

    await waitForRegistration(sdk, functionId)

    const scope = `update_scope_${Date.now()}`
    const key = `update_key_${Date.now()}`
    await state.set(scope, key, { version: 1 })
    await sleep(1500)
    await state.set(scope, key, { version: 2 })
    await sleep(1500)

    expect(received.length).toBeGreaterThanOrEqual(2)
  }, 20000)

  it('state delete fires handler', async () => {
    const sdk = getInstance()
    const functionId = `test.state-trigger.delete.${Date.now()}`
    const received: unknown[] = []

    sdk.registerFunction({ id: functionId }, async (data: unknown) => {
      received.push(data)
    })
    sdk.registerTrigger({
      type: 'state',
      function_id: functionId,
      config: {},
    })

    await waitForRegistration(sdk, functionId)

    const scope = `delete_scope_${Date.now()}`
    const key = `delete_key_${Date.now()}`
    await state.set(scope, key, { temp: true })
    await sleep(1500)
    await state.delete(scope, key)
    await sleep(1500)

    // Should have received at least 2 events: set + delete
    expect(received.length).toBeGreaterThanOrEqual(2)
  }, 20000)

  it('condition function filters state events', async () => {
    const sdk = getInstance()
    const functionId = `test.state-trigger.cond.${Date.now()}`
    const conditionPath = `${functionId}::conditions::0`
    let handlerCalls = 0

    sdk.registerFunction({ id: functionId }, async () => {
      handlerCalls += 1
    })
    sdk.registerFunction({ id: conditionPath }, async (input: { new_value?: { accept?: boolean } }) => {
      return input?.new_value?.accept === true
    })
    sdk.registerTrigger({
      type: 'state',
      function_id: functionId,
      config: {
        condition_function_id: conditionPath,
      },
    })

    await waitForRegistration(sdk, functionId)
    await waitForRegistration(sdk, conditionPath)

    const scope = `cond_scope_${Date.now()}`
    await state.set(scope, 'rejected', { accept: false })
    await state.set(scope, 'accepted', { accept: true })
    await sleep(2000)

    expect(handlerCalls).toBe(1)
  }, 15000)
})
