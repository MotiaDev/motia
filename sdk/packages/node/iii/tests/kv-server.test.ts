import { describe, expect, it } from 'vitest'
import { iii } from './utils'

function uniqueKey(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

describe('KV Server', () => {
  it('should set and get a value', async () => {
    const testKey = uniqueKey('test_key')
    const testValue = { name: 'test', value: 123 }

    await iii.call('kv_server::set', {
      index: 'test_index',
      key: testKey,
      value: testValue,
    })

    const result = await iii.call<{ index: string; key: string }, typeof testValue>(
      'kv_server::get',
      { index: 'test_index', key: testKey },
    )

    expect(result).toEqual(testValue)
  })

  it('should delete a value', async () => {
    const testKey = uniqueKey('delete_key')

    await iii.call('kv_server::set', {
      index: 'test_index',
      key: testKey,
      value: { data: 'to_delete' },
    })

    const beforeDelete = await iii.call('kv_server::get', {
      index: 'test_index',
      key: testKey,
    })
    expect(beforeDelete).not.toBeNull()
    expect(beforeDelete).toBeDefined()

    await iii.call('kv_server::delete', {
      index: 'test_index',
      key: testKey,
    })

    const afterDelete = await iii.call('kv_server::get', {
      index: 'test_index',
      key: testKey,
    })
    expect(afterDelete).toBeUndefined()
  })

  it('should list values in an index', async () => {
    const testIndex = uniqueKey('list_index')

    for (let i = 0; i < 3; i++) {
      await iii.call('kv_server::set', {
        index: testIndex,
        key: `item_${i}`,
        value: { id: i },
      })
    }

    const result = await iii.call<{ index: string }, unknown[]>('kv_server::list', {
      index: testIndex,
    })

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(3)
  })

  it('should return undefined for non-existent key', async () => {
    const result = await iii.call('kv_server::get', {
      index: 'nonexistent_index',
      key: 'nonexistent_key',
    })

    expect(result).toBeUndefined()
  })
})
