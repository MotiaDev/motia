import { getInstance, initIII } from '../../src/new/iii'
import { Stream } from '../../src/new/stream'
import { initTestEnv, waitForReady } from './setup'

describe('stream integration', () => {
  let stream: Stream<{ name?: string; value?: number; index?: number; count?: number }>
  let streamAvailable: boolean

  beforeAll(async () => {
    initTestEnv()
    initIII({ enabled: false })
    const sdk = getInstance()
    await waitForReady(sdk)
    stream = new Stream({
      name: `test_stream_${Date.now()}`,
      schema: { type: 'object', properties: {} },
      baseConfig: { storageType: 'default' },
    })
    try {
      await stream.get('__check__', '__check__')
      streamAvailable = true
    } catch (e) {
      streamAvailable = !String(e).toLowerCase().includes('function_not_found')
    }
  }, 15000)

  afterAll(async () => {
    const sdk = getInstance()
    await sdk.shutdown()
  })

  it('set then get returns stored value', async () => {
    if (!streamAvailable) return
    const groupId = `group_${Date.now()}`
    const itemId = `item_${Date.now()}`
    const data = { name: 'test', value: 42 }

    await stream.set(groupId, itemId, data)
    const result = await stream.get(groupId, itemId)

    expect(result).not.toBeNull()
    expect(result?.name).toBe('test')
    expect(result?.value).toBe(42)
  }, 10000)

  it('delete removes value', async () => {
    if (!streamAvailable) return
    const groupId = `group_delete_${Date.now()}`
    const itemId = `item_delete_${Date.now()}`

    await stream.set(groupId, itemId, { temp: true })
    const before = await stream.get(groupId, itemId)
    expect(before).not.toBeNull()

    await stream.delete(groupId, itemId)
    const after = await stream.get(groupId, itemId)
    expect(after == null).toBe(true)
  }, 10000)

  it('list returns all items in group', async () => {
    if (!streamAvailable) return
    const groupId = `group_list_${Date.now()}`

    await stream.set(groupId, 'item_0', { index: 0 })
    await stream.set(groupId, 'item_1', { index: 1 })
    await stream.set(groupId, 'item_2', { index: 2 })

    const items = await stream.list(groupId)
    expect(items.length).toBeGreaterThanOrEqual(3)
  }, 10000)

  it('listGroups returns available groups', async () => {
    if (!streamAvailable) return
    const groups = await stream.listGroups()
    expect(Array.isArray(groups)).toBe(true)
  }, 10000)

  it('update applies partial updates', async () => {
    if (!streamAvailable) return
    const groupId = `group_update_${Date.now()}`
    const itemId = `item_update_${Date.now()}`

    await stream.set(groupId, itemId, { count: 0, name: 'initial' })
    await stream.update(groupId, itemId, [{ type: 'set', path: 'count', value: 5 }])

    const result = await stream.get(groupId, itemId)
    expect(result?.count).toBe(5)
  }, 10000)
})
