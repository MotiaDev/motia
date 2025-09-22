import { RpcStateManager } from '../node/rpc-state-manager'
import { MemoryStateAdapter } from '../state/adapters/memory-state-adapter'
import { StateOperation, BatchOperation } from '../types'

// Mock RPC sender for testing
class MockRpcSender {
  private stateAdapter: MemoryStateAdapter

  constructor() {
    this.stateAdapter = new MemoryStateAdapter()
  }

  async send<T>(method: string, params: any): Promise<T> {
    const { traceId, key, value, delta, expected, newValue, items, field, operations } = params

    switch (method) {
      case 'state.get':
        return this.stateAdapter.get(traceId, key) as T
      
      case 'state.set':
        return this.stateAdapter.set(traceId, key, value) as T
      
      case 'state.delete':
        return this.stateAdapter.delete(traceId, key) as T
      
      case 'state.clear':
        await this.stateAdapter.clear(traceId)
        return undefined as T
      
      case 'state.getGroup':
        return this.stateAdapter.getGroup(params.groupId) as T
      
      case 'state.update':
        const updateFn = new Function('current', `return (${params.updateFn})(current)`) as (current: any) => any
        return this.stateAdapter.update(traceId, key, updateFn) as T
      
      case 'state.increment':
        return this.stateAdapter.increment(traceId, key, delta) as T
      
      case 'state.decrement':
        return this.stateAdapter.decrement(traceId, key, delta) as T
      
      case 'state.compareAndSwap':
        return this.stateAdapter.compareAndSwap(traceId, key, expected, newValue) as T
      
      case 'state.push':
        return this.stateAdapter.push(traceId, key, ...items) as T
      
      case 'state.pop':
        return this.stateAdapter.pop(traceId, key) as T
      
      case 'state.shift':
        return this.stateAdapter.shift(traceId, key) as T
      
      case 'state.unshift':
        return this.stateAdapter.unshift(traceId, key, ...items) as T
      
      case 'state.setField':
        return this.stateAdapter.setField(traceId, key, field as any, value) as T
      
      case 'state.deleteField':
        return this.stateAdapter.deleteField(traceId, key, field) as T
      
      case 'state.transaction':
        return this.stateAdapter.transaction(traceId, operations) as T
      
      case 'state.batch':
        return this.stateAdapter.batch(traceId, operations) as T
      
      case 'state.exists':
        return this.stateAdapter.exists(traceId, key) as T
      
      default:
        throw new Error(`Unknown RPC method: ${method}`)
    }
  }
}

describe('RPC Atomic Operations Tests', () => {
  let rpcStateManager: RpcStateManager
  let mockSender: MockRpcSender
  const testTraceId = 'test-trace-rpc'

  beforeEach(() => {
    mockSender = new MockRpcSender()
    rpcStateManager = new RpcStateManager(mockSender as any)
  })

  describe('Basic RPC Operations', () => {
    test('should perform RPC get and set', async () => {
      await rpcStateManager.set(testTraceId, 'test-key', 'test-value')
      const result = await rpcStateManager.get(testTraceId, 'test-key')
      expect(result).toBe('test-value')
    })

    test('should perform RPC delete', async () => {
      await rpcStateManager.set(testTraceId, 'delete-key', 'delete-value')
      const deleted = await rpcStateManager.delete(testTraceId, 'delete-key')
      expect(deleted).toBe('delete-value')
      
      const result = await rpcStateManager.get(testTraceId, 'delete-key')
      expect(result).toBeNull()
    })

    test('should perform RPC clear', async () => {
      await rpcStateManager.set(testTraceId, 'key1', 'value1')
      await rpcStateManager.set(testTraceId, 'key2', 'value2')
      
      await rpcStateManager.clear(testTraceId)
      
      const result1 = await rpcStateManager.get(testTraceId, 'key1')
      const result2 = await rpcStateManager.get(testTraceId, 'key2')
      expect(result1).toBeNull()
      expect(result2).toBeNull()
    })
  })

  describe('RPC Atomic Primitives', () => {
    test('should perform RPC increment', async () => {
      const result1 = await rpcStateManager.increment(testTraceId, 'counter')
      expect(result1).toBe(1)

      const result2 = await rpcStateManager.increment(testTraceId, 'counter', 5)
      expect(result2).toBe(6)

      const current = await rpcStateManager.get(testTraceId, 'counter')
      expect(current).toBe(6)
    })

    test('should perform RPC decrement', async () => {
      await rpcStateManager.set(testTraceId, 'counter', 10)
      
      const result1 = await rpcStateManager.decrement(testTraceId, 'counter')
      expect(result1).toBe(9)

      const result2 = await rpcStateManager.decrement(testTraceId, 'counter', 3)
      expect(result2).toBe(6)
    })

    test('should perform RPC compare and swap', async () => {
      await rpcStateManager.set(testTraceId, 'value', 'initial')
      
      const success1 = await rpcStateManager.compareAndSwap(testTraceId, 'value', 'initial', 'updated')
      expect(success1).toBe(true)
      
      const current1 = await rpcStateManager.get(testTraceId, 'value')
      expect(current1).toBe('updated')

      const success2 = await rpcStateManager.compareAndSwap(testTraceId, 'value', 'wrong', 'failed')
      expect(success2).toBe(false)
      
      const current2 = await rpcStateManager.get(testTraceId, 'value')
      expect(current2).toBe('updated')
    })
  })

  describe('RPC Array Operations', () => {
    test('should perform RPC push', async () => {
      const result1 = await rpcStateManager.push(testTraceId, 'array', 'item1')
      expect(result1).toEqual(['item1'])

      const result2 = await rpcStateManager.push(testTraceId, 'array', 'item2', 'item3')
      expect(result2).toEqual(['item1', 'item2', 'item3'])
    })

    test('should perform RPC pop', async () => {
      await rpcStateManager.set(testTraceId, 'array', ['a', 'b', 'c'])
      
      const popped = await rpcStateManager.pop(testTraceId, 'array')
      expect(popped).toBe('c')
      
      const current = await rpcStateManager.get(testTraceId, 'array')
      expect(current).toEqual(['a', 'b'])
    })

    test('should perform RPC shift', async () => {
      await rpcStateManager.set(testTraceId, 'array', ['a', 'b', 'c'])
      
      const shifted = await rpcStateManager.shift(testTraceId, 'array')
      expect(shifted).toBe('a')
      
      const current = await rpcStateManager.get(testTraceId, 'array')
      expect(current).toEqual(['b', 'c'])
    })

    test('should perform RPC unshift', async () => {
      await rpcStateManager.set(testTraceId, 'array', ['c'])
      
      const result = await rpcStateManager.unshift(testTraceId, 'array', 'a', 'b')
      expect(result).toEqual(['a', 'b', 'c'])
    })
  })

  describe('RPC Object Operations', () => {
    test('should perform RPC setField', async () => {
      await rpcStateManager.set(testTraceId, 'user', { name: 'John', age: 30 })
      
      const result = await rpcStateManager.setField(testTraceId, 'user', 'age', 31)
      expect(result).toEqual({ name: 'John', age: 31 })
    })

    test('should perform RPC deleteField', async () => {
      await rpcStateManager.set(testTraceId, 'user', { name: 'John', age: 30, temp: 'data' })
      
      const result = await rpcStateManager.deleteField(testTraceId, 'user', 'temp')
      expect(result).toEqual({ name: 'John', age: 30 })
    })
  })

  describe('RPC Transaction Operations', () => {
    test('should perform RPC transaction', async () => {
      const operations: StateOperation[] = [
        { type: 'set', key: 'counter', value: 0 },
        { type: 'increment', key: 'counter', delta: 5 },
        { type: 'set', key: 'status', value: 'active' },
        { type: 'push', key: 'log', items: ['transaction started'] }
      ]

      const result = await rpcStateManager.transaction(testTraceId, operations)
      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(4)

      // Verify all operations were applied
      const counter = await rpcStateManager.get(testTraceId, 'counter')
      const status = await rpcStateManager.get(testTraceId, 'status')
      const log = await rpcStateManager.get(testTraceId, 'log')

      expect(counter).toBe(5)
      expect(status).toBe('active')
      expect(log).toEqual(['transaction started'])
    })
  })

  describe('RPC Batch Operations', () => {
    test('should perform RPC batch operations', async () => {
      const operations: BatchOperation[] = [
        { type: 'set', key: 'user1', value: 'Alice', id: 'op1' },
        { type: 'set', key: 'user2', value: 'Bob', id: 'op2' },
        { type: 'increment', key: 'counter', delta: 1, id: 'op3' },
        { type: 'push', key: 'users', items: ['Charlie'], id: 'op4' }
      ]

      const result = await rpcStateManager.batch(testTraceId, operations)
      expect(result.results).toHaveLength(4)

      // Check that all operations succeeded
      for (const opResult of result.results) {
        expect(opResult.error).toBeUndefined()
      }

      // Verify results
      const user1 = await rpcStateManager.get(testTraceId, 'user1')
      const user2 = await rpcStateManager.get(testTraceId, 'user2')
      const counter = await rpcStateManager.get(testTraceId, 'counter')
      const users = await rpcStateManager.get(testTraceId, 'users')

      expect(user1).toBe('Alice')
      expect(user2).toBe('Bob')
      expect(counter).toBe(1)
      expect(users).toEqual(['Charlie'])
    })
  })

  describe('RPC Utility Operations', () => {
    test('should perform RPC exists check', async () => {
      const exists1 = await rpcStateManager.exists(testTraceId, 'nonexistent')
      expect(exists1).toBe(false)

      await rpcStateManager.set(testTraceId, 'test', 'value')
      
      const exists2 = await rpcStateManager.exists(testTraceId, 'test')
      expect(exists2).toBe(true)
    })
  })

  describe('RPC Error Handling', () => {
    test('should handle RPC errors gracefully', async () => {
      // Test with invalid method
      const invalidSender = {
        send: jest.fn().mockRejectedValue(new Error('RPC Error'))
      }
      
      const invalidRpcManager = new RpcStateManager(invalidSender as any)
      
      await expect(invalidRpcManager.get(testTraceId, 'test')).rejects.toThrow('RPC Error')
    })

    test('should handle function serialization in update', async () => {
      const result = await rpcStateManager.update(testTraceId, 'counter', (current: number | null) => {
        return (current || 0) + 10
      })

      expect(result).toBe(10)

      const current = await rpcStateManager.get(testTraceId, 'counter')
      expect(current).toBe(10)
    })
  })

  describe('RPC Performance', () => {
    test('should handle multiple RPC calls efficiently', async () => {
      const startTime = Date.now()
      
      // Perform multiple RPC operations
      const promises = Array.from({ length: 100 }, (_, i) => 
        rpcStateManager.set(testTraceId, `key-${i}`, `value-${i}`)
      )

      await Promise.all(promises)

      const endTime = Date.now()
      const duration = endTime - startTime

      // Verify all operations completed
      for (let i = 0; i < 100; i++) {
        const value = await rpcStateManager.get(testTraceId, `key-${i}`)
        expect(value).toBe(`value-${i}`)
      }

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000) // 5 seconds
    })
  })
})
