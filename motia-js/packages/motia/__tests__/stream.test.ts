import { Stream } from '../src/new/stream'

const mockCall = jest.fn()

jest.mock('../src/new/iii', () => ({
  getInstance: () => ({ call: mockCall }),
}))

describe('Stream', () => {
  const config = {
    name: 'test-stream',
    schema: { type: 'object' },
    baseConfig: { storageType: 'default' as const },
  }

  let stream: Stream<{ id: string; value: string }>

  beforeEach(() => {
    mockCall.mockReset()
    stream = new Stream(config as any)
  })

  it('get() calls stream::get with stream_name, group_id, item_id', async () => {
    mockCall.mockResolvedValue({ id: '1', value: 'data' })
    await stream.get('group1', 'item1')
    expect(mockCall).toHaveBeenCalledWith('stream::get', {
      stream_name: 'test-stream',
      group_id: 'group1',
      item_id: 'item1',
    })
  })

  it('set() calls stream::set with full payload', async () => {
    mockCall.mockResolvedValue(null)
    await stream.set('group1', 'item1', { id: '1', value: 'x' })
    expect(mockCall).toHaveBeenCalledWith('stream::set', {
      stream_name: 'test-stream',
      group_id: 'group1',
      item_id: 'item1',
      data: { id: '1', value: 'x' },
    })
  })

  it('delete() calls stream::delete', async () => {
    mockCall.mockResolvedValue(undefined)
    await stream.delete('group1', 'item1')
    expect(mockCall).toHaveBeenCalledWith('stream::delete', {
      stream_name: 'test-stream',
      group_id: 'group1',
      item_id: 'item1',
    })
  })

  it('list() calls stream::list', async () => {
    mockCall.mockResolvedValue([])
    await stream.list('group1')
    expect(mockCall).toHaveBeenCalledWith('stream::list', {
      stream_name: 'test-stream',
      group_id: 'group1',
    })
  })

  it('update() calls stream::update with ops', async () => {
    mockCall.mockResolvedValue(null)
    await stream.update('group1', 'item1', [{ op: 'set' as const, path: 'x', value: 1 }])
    expect(mockCall).toHaveBeenCalledWith('stream::update', {
      stream_name: 'test-stream',
      group_id: 'group1',
      item_id: 'item1',
      ops: [{ op: 'set', path: 'x', value: 1 }],
    })
  })

  it('listGroups() calls stream::list_groups', async () => {
    mockCall.mockResolvedValue(['g1', 'g2'])
    await stream.listGroups()
    expect(mockCall).toHaveBeenCalledWith('stream::list_groups', {
      stream_name: 'test-stream',
    })
  })
})
