import { StateManager } from '../src/new/state'

const mockCall = jest.fn()

jest.mock('../src/new/iii', () => ({
  getInstance: () => ({ call: mockCall }),
}))

describe('StateManager', () => {
  let manager: StateManager

  beforeEach(() => {
    mockCall.mockReset()
    manager = new StateManager()
  })

  it('get() calls state::get with scope and key', async () => {
    mockCall.mockResolvedValue({ id: '1', value: 'data' })
    await manager.get('scope1', 'key1')
    expect(mockCall).toHaveBeenCalledWith('state::get', { scope: 'scope1', key: 'key1' })
  })

  it('set() calls state::set with scope, key, data', async () => {
    mockCall.mockResolvedValue(null)
    await manager.set('scope1', 'key1', { name: 'test' })
    expect(mockCall).toHaveBeenCalledWith('state::set', {
      scope: 'scope1',
      key: 'key1',
      data: { name: 'test' },
    })
  })

  it('delete() calls state::delete with scope and key', async () => {
    mockCall.mockResolvedValue(null)
    await manager.delete('scope1', 'key1')
    expect(mockCall).toHaveBeenCalledWith('state::delete', { scope: 'scope1', key: 'key1' })
  })

  it('list() calls state::list with scope', async () => {
    mockCall.mockResolvedValue([])
    await manager.list('scope1')
    expect(mockCall).toHaveBeenCalledWith('state::list', { scope: 'scope1' })
  })

  it('listGroups() calls state::list_groups with empty object', async () => {
    mockCall.mockResolvedValue([])
    await manager.listGroups()
    expect(mockCall).toHaveBeenCalledWith('state::list_groups', {})
  })

  it('update() calls state::update with scope, key, ops', async () => {
    mockCall.mockResolvedValue(null)
    await manager.update('scope1', 'key1', [{ op: 'set' as const, path: 'x', value: 1 }])
    expect(mockCall).toHaveBeenCalledWith('state::update', {
      scope: 'scope1',
      key: 'key1',
      ops: [{ op: 'set', path: 'x', value: 1 }],
    })
  })

  it('clear() lists then deletes each item', async () => {
    mockCall
      .mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }])
      .mockResolvedValue(null)
    await manager.clear('scope1')
    expect(mockCall).toHaveBeenCalledWith('state::list', { scope: 'scope1' })
    expect(mockCall).toHaveBeenCalledWith('state::delete', { scope: 'scope1', key: 'a' })
    expect(mockCall).toHaveBeenCalledWith('state::delete', { scope: 'scope1', key: 'b' })
  })
})
