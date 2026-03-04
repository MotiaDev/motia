import { getInstance, initIII } from '../../src/new/iii'
import { Stream } from '../../src/new/stream'
import { initTestEnv, sleep, waitForReady, waitForRegistration } from './setup'

describe('stream trigger integration', () => {
  const streamName = `test_trigger_stream_${Date.now()}`
  let stream: Stream<{ name?: string; value?: number; temp?: boolean; accept?: boolean }>

  beforeAll(async () => {
    initTestEnv()
    initIII({ enabled: false })
    const sdk = getInstance()
    await waitForReady(sdk)
    stream = new Stream({
      name: streamName,
      schema: { type: 'object', properties: {} },
      baseConfig: { storageType: 'default' },
    })
  }, 15000)

  afterAll(async () => {
    const sdk = getInstance()
    await sdk.shutdown()
  })

  it('stream set fires registered stream trigger handler', async () => {
    const sdk = getInstance()
    const functionId = `test.stream-trigger.set.${Date.now()}`
    let received: unknown = null

    sdk.registerFunction({ id: functionId }, async (data: unknown) => {
      received = data
    })
    sdk.registerTrigger({
      type: 'stream',
      function_id: functionId,
      config: { stream_name: streamName },
    })

    await waitForRegistration(sdk, functionId)

    const groupId = `trigger_group_${Date.now()}`
    const itemId = `trigger_item_${Date.now()}`
    await stream.set(groupId, itemId, { name: 'test', value: 1 })
    await sleep(2000)

    expect(received).not.toBeNull()
  }, 15000)

  it('handler receives correct stream event payload', async () => {
    const sdk = getInstance()
    const functionId = `test.stream-trigger.payload.${Date.now()}`
    let received: unknown = null

    sdk.registerFunction({ id: functionId }, async (data: unknown) => {
      received = data
    })
    sdk.registerTrigger({
      type: 'stream',
      function_id: functionId,
      config: { stream_name: streamName },
    })

    await waitForRegistration(sdk, functionId)

    const groupId = `payload_group_${Date.now()}`
    const itemId = `payload_item_${Date.now()}`
    await stream.set(groupId, itemId, { name: 'payload-test', value: 42 })
    await sleep(2000)

    const payload = received as {
      type?: string
      streamName?: string
      groupId?: string
      id?: string
      event?: { type: string; data: unknown }
    }
    expect(payload?.type).toBe('stream')
    expect(payload?.streamName).toBe(streamName)
    expect(payload?.groupId).toBe(groupId)
    expect(payload?.id).toBe(itemId)
    expect(payload?.event?.type).toBe('create')
    expect(payload?.event?.data).toEqual({ name: 'payload-test', value: 42 })
  }, 15000)

  it('stream update fires handler with update event', async () => {
    const sdk = getInstance()
    const functionId = `test.stream-trigger.update.${Date.now()}`
    const received: unknown[] = []

    sdk.registerFunction({ id: functionId }, async (data: unknown) => {
      received.push(data)
    })
    sdk.registerTrigger({
      type: 'stream',
      function_id: functionId,
      config: { stream_name: streamName },
    })

    await waitForRegistration(sdk, functionId)

    const groupId = `update_group_${Date.now()}`
    const itemId = `update_item_${Date.now()}`
    await stream.set(groupId, itemId, { value: 1 })
    await sleep(1500)
    await stream.set(groupId, itemId, { value: 2 })
    await sleep(1500)

    expect(received.length).toBeGreaterThanOrEqual(2)
    const lastEvent = received[received.length - 1] as { event?: { type: string } }
    expect(lastEvent?.event?.type).toBe('update')
  }, 20000)

  it('stream delete fires handler with delete event', async () => {
    const sdk = getInstance()
    const functionId = `test.stream-trigger.delete.${Date.now()}`
    const received: unknown[] = []

    sdk.registerFunction({ id: functionId }, async (data: unknown) => {
      received.push(data)
    })
    sdk.registerTrigger({
      type: 'stream',
      function_id: functionId,
      config: { stream_name: streamName },
    })

    await waitForRegistration(sdk, functionId)

    const groupId = `delete_group_${Date.now()}`
    const itemId = `delete_item_${Date.now()}`
    await stream.set(groupId, itemId, { temp: true })
    await sleep(1500)
    await stream.delete(groupId, itemId)
    await sleep(1500)

    expect(received.length).toBeGreaterThanOrEqual(2)
    const lastEvent = received[received.length - 1] as { event?: { type: string } }
    expect(lastEvent?.event?.type).toBe('delete')
  }, 20000)

  it('condition function filters stream events', async () => {
    const sdk = getInstance()
    const functionId = `test.stream-trigger.cond.${Date.now()}`
    const conditionPath = `${functionId}::conditions::0`
    let handlerCalls = 0

    sdk.registerFunction({ id: functionId }, async () => {
      handlerCalls += 1
    })
    sdk.registerFunction({ id: conditionPath }, async (input: { event?: { data?: { accept?: boolean } } }) => {
      return input?.event?.data?.accept === true
    })
    sdk.registerTrigger({
      type: 'stream',
      function_id: functionId,
      config: {
        stream_name: streamName,
        condition_function_id: conditionPath,
      },
    })

    await waitForRegistration(sdk, functionId)
    await waitForRegistration(sdk, conditionPath)

    const groupId = `cond_group_${Date.now()}`
    await stream.set(groupId, 'rejected', { accept: false })
    await stream.set(groupId, 'accepted', { accept: true })
    await sleep(2000)

    expect(handlerCalls).toBe(1)
  }, 15000)
})
