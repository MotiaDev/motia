import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { FileStreamAdapter } from '../defaults/stream/file-stream-adapter'
import { MemoryStreamAdapter } from '../defaults/stream/memory-stream-adapter'

type User = { name: string }
type Order = { total: number }
type TestItem = { type: string }

describe('Stream Adapter Namespace Isolation', () => {
  describe('MemoryStreamAdapter', () => {
    it('should isolate streams by name using different groupIds', async () => {
      const usersAdapter = new MemoryStreamAdapter<User>('users')
      const ordersAdapter = new MemoryStreamAdapter<Order>('orders')

      await usersAdapter.set('active', 'user-1', { name: 'John' })
      await ordersAdapter.set('active', 'order-1', { total: 100 })

      const usersGroup = await usersAdapter.getGroup('active')
      const ordersGroup = await ordersAdapter.getGroup('active')

      expect(usersGroup).toHaveLength(1)
      expect(ordersGroup).toHaveLength(1)
      expect(usersGroup[0]).toEqual({ name: 'John', id: 'user-1' })
      expect(ordersGroup[0]).toEqual({ total: 100, id: 'order-1' })
    })

    it('should not find items from different stream with same groupId', async () => {
      const usersAdapter = new MemoryStreamAdapter<TestItem>('users')
      const ordersAdapter = new MemoryStreamAdapter<TestItem>('orders')

      await usersAdapter.set('group1', 'item1', { type: 'user-data' })
      await ordersAdapter.set('group1', 'item1', { type: 'order-data' })

      const userItem = await usersAdapter.get('group1', 'item1')
      const orderItem = await ordersAdapter.get('group1', 'item1')

      expect(userItem).toEqual({ type: 'user-data', id: 'item1' })
      expect(orderItem).toEqual({ type: 'order-data', id: 'item1' })
      expect(userItem).not.toEqual(orderItem)
    })

    it('should clear only items from specific stream', async () => {
      const stream1 = new MemoryStreamAdapter<{ value: number }>('stream1')
      const stream2 = new MemoryStreamAdapter<{ value: number }>('stream2')

      await stream1.set('group1', 'item1', { value: 1 })
      await stream2.set('group1', 'item1', { value: 2 })

      await stream1.clear('group1')

      const stream1Items = await stream1.getGroup('group1')
      const stream2Items = await stream2.getGroup('group1')

      expect(stream1Items).toHaveLength(0)
      expect(stream2Items).toHaveLength(1)
    })
  })

  describe('FileStreamAdapter', () => {
    let tempDir: string

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'motia-test-'))
    })

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true })
    })

    it('should isolate streams in different files', async () => {
      const usersAdapter = new FileStreamAdapter<User>(tempDir, 'users')
      const ordersAdapter = new FileStreamAdapter<Order>(tempDir, 'orders')

      usersAdapter.init()
      ordersAdapter.init()

      await usersAdapter.set('active', 'user-1', { name: 'John' })
      await ordersAdapter.set('active', 'order-1', { total: 100 })

      const usersGroup = await usersAdapter.getGroup('active')
      const ordersGroup = await ordersAdapter.getGroup('active')

      expect(usersGroup).toHaveLength(1)
      expect(ordersGroup).toHaveLength(1)
      expect(usersGroup[0].name).toBe('John')
      expect(ordersGroup[0].total).toBe(100)
    })

    it('should maintain isolation after adapter recreation', async () => {
      let usersAdapter = new FileStreamAdapter<TestItem>(tempDir, 'users')
      let ordersAdapter = new FileStreamAdapter<TestItem>(tempDir, 'orders')

      usersAdapter.init()
      ordersAdapter.init()

      await usersAdapter.set('group1', 'item1', { type: 'user' })
      await ordersAdapter.set('group1', 'item1', { type: 'order' })

      usersAdapter = new FileStreamAdapter<TestItem>(tempDir, 'users')
      ordersAdapter = new FileStreamAdapter<TestItem>(tempDir, 'orders')

      const userItem = await usersAdapter.get('group1', 'item1')
      const orderItem = await ordersAdapter.get('group1', 'item1')

      expect(userItem?.type).toBe('user')
      expect(orderItem?.type).toBe('order')
    })
  })
})
