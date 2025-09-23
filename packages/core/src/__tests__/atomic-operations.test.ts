import { MemoryStateAdapter } from '../state/adapters/memory-state-adapter'
import { FileStateAdapter } from '../state/adapters/default-state-adapter'
import { StateWrapper } from '../state-wrapper'
import { StateOperation, BatchOperation } from '../types'

describe('Atomic Operations Tests', () => {
  let memoryAdapter: MemoryStateAdapter
  let fileAdapter: FileStateAdapter
  let memoryWrapper: StateWrapper
  let fileWrapper: StateWrapper
  const testTraceId = 'test-trace-123'
  const testDir = '/tmp/motia-test'

  beforeEach(() => {
    memoryAdapter = new MemoryStateAdapter()
    fileAdapter = new FileStateAdapter({ adapter: 'default', filePath: testDir })
    memoryWrapper = new StateWrapper(memoryAdapter)
    fileWrapper = new StateWrapper(fileAdapter)
  })

  afterEach(async () => {
    // Clean up file adapter
    await fileAdapter.clear(testTraceId)
  })

  describe('Memory Adapter Tests', () => {
    describe('Memory - Basic Atomic Operations', () => {
      test('should perform atomic increment', async () => {
        const result1 = await memoryAdapter.increment(testTraceId, 'counter')
        expect(result1).toBe(1)

        const result2 = await memoryAdapter.increment(testTraceId, 'counter', 5)
        expect(result2).toBe(6)

        const current = await memoryAdapter.get(testTraceId, 'counter')
        expect(current).toBe(6)
      })

      test('should perform atomic decrement', async () => {
        await memoryAdapter.set(testTraceId, 'counter', 10)

        const result1 = await memoryAdapter.decrement(testTraceId, 'counter')
        expect(result1).toBe(9)

        const result2 = await memoryAdapter.decrement(testTraceId, 'counter', 3)
        expect(result2).toBe(6)
      })

      test('should perform compare and swap', async () => {
        await memoryAdapter.set(testTraceId, 'value', 'initial')

        const success1 = await memoryAdapter.compareAndSwap(testTraceId, 'value', 'initial', 'updated')
        expect(success1).toBe(true)

        const success2 = await memoryAdapter.compareAndSwap(testTraceId, 'value', 'wrong', 'new')
        expect(success2).toBe(false)

        const current = await memoryAdapter.get(testTraceId, 'value')
        expect(current).toBe('updated')
      })

      test('should check if key exists', async () => {
        const exists1 = await memoryAdapter.exists(testTraceId, 'nonexistent')
        expect(exists1).toBe(false)

        await memoryAdapter.set(testTraceId, 'test', 'value')
        const exists2 = await memoryAdapter.exists(testTraceId, 'test')
        expect(exists2).toBe(true)
      })
    })

    describe('Memory - Array Operations', () => {
      test('should perform atomic push', async () => {
        const result1 = await memoryAdapter.push(testTraceId, 'array', 'item1')
        expect(result1).toEqual(['item1'])

        const result2 = await memoryAdapter.push(testTraceId, 'array', 'item2', 'item3')
        expect(result2).toEqual(['item1', 'item2', 'item3'])
      })

      test('should perform atomic pop', async () => {
        await memoryAdapter.set(testTraceId, 'array', ['a', 'b', 'c'])

        const popped = await memoryAdapter.pop(testTraceId, 'array')
        expect(popped).toBe('c')

        const current = await memoryAdapter.get(testTraceId, 'array')
        expect(current).toEqual(['a', 'b'])

        // Pop from empty array
        await memoryAdapter.set(testTraceId, 'empty', [])
        const emptyPop = await memoryAdapter.pop(testTraceId, 'empty')
        expect(emptyPop).toBeNull()
      })

      test('should perform atomic shift', async () => {
        await memoryAdapter.set(testTraceId, 'array', ['a', 'b', 'c'])

        const shifted = await memoryAdapter.shift(testTraceId, 'array')
        expect(shifted).toBe('a')

        const current = await memoryAdapter.get(testTraceId, 'array')
        expect(current).toEqual(['b', 'c'])
      })

      test('should perform atomic unshift', async () => {
        await memoryAdapter.set(testTraceId, 'array', ['c'])

        const result = await memoryAdapter.unshift(testTraceId, 'array', 'a', 'b')
        expect(result).toEqual(['a', 'b', 'c'])
      })
    })

    describe('Memory - Object Operations', () => {
      test('should perform atomic setField', async () => {
        await memoryAdapter.set(testTraceId, 'user', { name: 'John', age: 30 })

        const result = await memoryAdapter.setField(testTraceId, 'user', 'age', 31)
        expect(result).toEqual({ name: 'John', age: 31 })
      })

      test('should perform atomic deleteField', async () => {
        await memoryAdapter.set(testTraceId, 'user', { name: 'John', age: 30, temp: 'data' })

        const result = await memoryAdapter.deleteField(testTraceId, 'user', 'temp')
        expect(result).toEqual({ name: 'John', age: 30 })
      })
    })

    describe('Memory - Transaction Operations', () => {
      test('should perform atomic transaction', async () => {
        const operations: StateOperation[] = [
          { type: 'set', key: 'counter', value: 0 },
          { type: 'increment', key: 'counter', delta: 5 },
          { type: 'set', key: 'status', value: 'active' },
          { type: 'push', key: 'log', items: ['transaction started'] },
        ]

        const result = await memoryAdapter.transaction(testTraceId, operations)
        expect(result.success).toBe(true)
        expect(result.results).toHaveLength(4)

        // Verify all operations were applied
        const counter = await memoryAdapter.get(testTraceId, 'counter')
        const status = await memoryAdapter.get(testTraceId, 'status')
        const log = await memoryAdapter.get(testTraceId, 'log')

        expect(counter).toBe(5)
        expect(status).toBe('active')
        expect(log).toEqual(['transaction started'])
      })

      test('should handle transaction failure', async () => {
        const operations: StateOperation[] = [
          { type: 'set', key: 'counter', value: 0 },
          {
            type: 'update',
            key: 'counter',
            updateFn: () => {
              throw new Error('Test error')
            },
          },
          { type: 'set', key: 'status', value: 'active' },
        ]

        const result = await memoryAdapter.transaction(testTraceId, operations)
        expect(result.success).toBe(false)
        expect(result.error).toContain('Test error')
      })
    })

    describe('Memory - Batch Operations', () => {
      test('should perform atomic batch operations', async () => {
        const operations: BatchOperation[] = [
          { type: 'set', key: 'user1', value: 'Alice', id: 'op1' },
          { type: 'set', key: 'user2', value: 'Bob', id: 'op2' },
          { type: 'increment', key: 'counter', delta: 1, id: 'op3' },
          { type: 'push', key: 'log', items: ['batch operation'], id: 'op4' },
        ]

        const result = await memoryAdapter.batch(testTraceId, operations)
        expect(result.results).toHaveLength(4)

        // Check that all operations succeeded
        const user1 = await memoryAdapter.get(testTraceId, 'user1')
        const user2 = await memoryAdapter.get(testTraceId, 'user2')
        const counter = await memoryAdapter.get(testTraceId, 'counter')
        const log = await memoryAdapter.get(testTraceId, 'log')

        expect(user1).toBe('Alice')
        expect(user2).toBe('Bob')
        expect(counter).toBe(1)
        expect(log).toEqual(['batch operation'])
      })

      test('should handle batch operation failures gracefully', async () => {
        const operations: BatchOperation[] = [
          { type: 'set', key: 'user1', value: 'Alice', id: 'op1' },
          {
            type: 'update',
            key: 'invalid',
            updateFn: () => {
              throw new Error('Test error')
            },
            id: 'op2',
          },
          { type: 'set', key: 'user2', value: 'Bob', id: 'op3' },
        ]

        const result = await memoryAdapter.batch(testTraceId, operations)
        expect(result.results).toHaveLength(3)

        // Check that op1 and op3 succeeded, op2 failed
        const op1 = result.results.find((r: any) => r.id === 'op1')
        const op2 = result.results.find((r: any) => r.id === 'op2')
        const op3 = result.results.find((r: any) => r.id === 'op3')

        expect(op1?.error).toBeUndefined()
        expect(op2?.error).toContain('Test error')
        expect(op3?.error).toBeUndefined()

        // Verify successful operations were applied
        const user1 = await memoryAdapter.get(testTraceId, 'user1')
        const user2 = await memoryAdapter.get(testTraceId, 'user2')
        expect(user1).toBe('Alice')
        expect(user2).toBe('Bob')
      })
    })

    describe('Memory - Concurrency Tests', () => {
      test('should handle concurrent increments atomically', async () => {
        const promises = Array.from({ length: 100 }, () => memoryAdapter.increment(testTraceId, 'concurrent-counter'))

        await Promise.all(promises)

        const finalValue = await memoryAdapter.get(testTraceId, 'concurrent-counter')
        expect(finalValue).toBe(100)
      })

      test('should handle concurrent array operations atomically', async () => {
        const promises = Array.from({ length: 50 }, (_, i) =>
          memoryAdapter.push(testTraceId, 'concurrent-array', `item-${i}`),
        )

        await Promise.all(promises)

        const finalArray = await memoryAdapter.get(testTraceId, 'concurrent-array')
        expect(finalArray).toHaveLength(50)
      })

      test('should handle concurrent compare and swap operations', async () => {
        await memoryAdapter.set(testTraceId, 'cas-value', 0)

        const promises = Array.from({ length: 100 }, () => memoryAdapter.compareAndSwap(testTraceId, 'cas-value', 0, 1))

        const results = await Promise.all(promises)
        const successCount = results.filter(Boolean).length
        expect(successCount).toBe(1) // Only one should succeed
      })
    })

    describe('Memory - Error Handling', () => {
      test('should handle invalid operations gracefully', async () => {
        // Test invalid increment on non-numeric value
        await memoryAdapter.set(testTraceId, 'string-value', 'not-a-number')

        await expect(memoryAdapter.increment(testTraceId, 'string-value')).rejects.toThrow()
      })

      test('should handle missing keys in operations', async () => {
        const operations: StateOperation[] = [
          { type: 'get', key: 'nonexistent' },
          { type: 'increment', key: 'nonexistent', delta: 1 },
        ]

        const result = await memoryAdapter.transaction(testTraceId, operations)
        expect(result.success).toBe(true)
        expect(result.results[0]).toBeNull() // get on nonexistent key
        expect(result.results[1]).toBe(1) // increment creates key with value 1
      })
    })
  })

  describe('State Wrapper Callback Tests', () => {
    test('should call state change callback for atomic operations', async () => {
      const callback = jest.fn()
      const testTraceId = 'callback-test-trace'
      const memoryWrapper = new StateWrapper(new MemoryStateAdapter())
      memoryWrapper.setStateChangeCallback(callback)

      await memoryWrapper.increment(testTraceId, 'callback-test')
      await memoryWrapper.push(testTraceId, 'callback-array', 'item')
      await memoryWrapper.setField(testTraceId, 'callback-obj', 'field', 'value')

      expect(callback).toHaveBeenCalledTimes(3)
      expect(callback).toHaveBeenCalledWith(testTraceId, 'callback-test', 1, 1)
      expect(callback).toHaveBeenCalledWith(testTraceId, 'callback-array', ['item'], 1)
      expect(callback).toHaveBeenCalledWith(testTraceId, 'callback-obj', { field: 'value' }, 1)
    })

    test('should handle callback errors gracefully', async () => {
      const callback = jest.fn().mockRejectedValue(new Error('Callback error'))
      const testTraceId = 'error-test-trace'
      const memoryWrapper = new StateWrapper(new MemoryStateAdapter())
      memoryWrapper.setStateChangeCallback(callback)

      // Should not throw even if callback fails
      const result = await memoryWrapper.increment(testTraceId, 'error-test')
      expect(result).toBe(1)
      expect(callback).toHaveBeenCalled()
    })

    test('should only fire callbacks for mutating operations in transactions', async () => {
      const callback = jest.fn()
      const testTraceId = 'transaction-filter-test'
      const memoryWrapper = new StateWrapper(new MemoryStateAdapter())
      memoryWrapper.setStateChangeCallback(callback)

      const operations: StateOperation[] = [
        { type: 'get', key: 'read-only' },
        { type: 'set', key: 'mutating', value: 'test' },
        { type: 'get', key: 'another-read' },
        { type: 'increment', key: 'counter' },
      ]

      const result = await memoryWrapper.transaction(testTraceId, operations)

      expect(result.success).toBe(true)

      // Should only call callback for mutating operations (set, increment)
      // Not for get operations
      expect(callback).toHaveBeenCalledTimes(2)

      // Verify the calls were for the mutating operations
      const callArgs = callback.mock.calls
      expect(callArgs[0][1]).toBe('mutating') // set operation
      expect(callArgs[1][1]).toBe('counter') // increment operation
      // Verify depth parameter is passed (incremented in notify method)
      expect(callArgs[0][3]).toBe(1) // depth for transaction/batch
      expect(callArgs[1][3]).toBe(1) // depth for transaction/batch
    })

    test('should only fire callbacks for mutating operations in batches', async () => {
      const callback = jest.fn()
      const testTraceId = 'batch-filter-test'
      const memoryWrapper = new StateWrapper(new MemoryStateAdapter())
      memoryWrapper.setStateChangeCallback(callback)

      const operations: BatchOperation[] = [
        { type: 'get', key: 'read-only', id: '1' },
        { type: 'set', key: 'mutating', value: 'test', id: '2' },
        { type: 'get', key: 'another-read', id: '3' },
        { type: 'increment', key: 'counter', id: '4' },
      ]

      const result = await memoryWrapper.batch(testTraceId, operations)

      expect(result.results).toBeDefined()

      // Should only call callback for mutating operations (set, increment)
      // Not for get operations
      expect(callback).toHaveBeenCalledTimes(2)

      // Verify the calls were for the mutating operations
      const callArgs = callback.mock.calls
      expect(callArgs[0][1]).toBe('mutating') // set operation
      expect(callArgs[1][1]).toBe('counter') // increment operation
      // Verify depth parameter is passed (incremented in notify method)
      expect(callArgs[0][3]).toBe(1) // depth for transaction/batch
      expect(callArgs[1][3]).toBe(1) // depth for transaction/batch
    })

    test('should handle object equality in compareAndSwap using JSON comparison', async () => {
      const testTraceId = 'cas-object-test'

      // Set initial object
      const initialObj = { name: 'test', value: 42 }
      await memoryAdapter.set(testTraceId, 'object', initialObj)

      // Create a new object with same content (different reference)
      const sameContentObj = { name: 'test', value: 42 }
      const newObj = { name: 'updated', value: 100 }

      // Should succeed because content is the same (JSON comparison)
      const result = await memoryAdapter.compareAndSwap(testTraceId, 'object', sameContentObj, newObj)
      expect(result).toBe(true)

      // Verify the object was updated
      const updated = await memoryAdapter.get(testTraceId, 'object')
      expect(updated).toEqual(newObj)
    })

    test('should fail compareAndSwap when object content differs', async () => {
      const testTraceId = 'cas-object-fail-test'

      // Set initial object
      const initialObj = { name: 'test', value: 42 }
      await memoryAdapter.set(testTraceId, 'object', initialObj)

      // Try to swap with different content
      const differentObj = { name: 'different', value: 99 }
      const newObj = { name: 'updated', value: 100 }

      // Should fail because content is different
      const result = await memoryAdapter.compareAndSwap(testTraceId, 'object', differentObj, newObj)
      expect(result).toBe(false)

      // Verify the object was not updated
      const unchanged = await memoryAdapter.get(testTraceId, 'object')
      expect(unchanged).toEqual(initialObj)
    })
  })
})
