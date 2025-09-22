import { MemoryStateAdapter } from '../state/adapters/memory-state-adapter'

describe('Atomic Update Functionality', () => {
  let stateAdapter: MemoryStateAdapter

  beforeEach(() => {
    stateAdapter = new MemoryStateAdapter()
  })

  describe('Basic Atomic Update', () => {
    it('should perform atomic updates correctly', async () => {
      const traceId = 'test-trace'
      const key = 'counter'

      // Initial value should be null
      const initialValue = await stateAdapter.get(traceId, key)
      expect(initialValue).toBeNull()

      // Perform atomic update
      const result = await stateAdapter.atomicUpdate!(traceId, key, (current: number | null) => {
        return (current || 0) + 1
      })

      expect(result).toBe(1)

      // Verify the value was set
      const storedValue = await stateAdapter.get(traceId, key)
      expect(storedValue).toBe(1)
    })

    it('should handle multiple atomic updates sequentially', async () => {
      const traceId = 'test-trace'
      const key = 'counter'

      // Perform multiple atomic updates
      const result1 = await stateAdapter.atomicUpdate!(traceId, key, (current: number | null) => {
        return (current || 0) + 10
      })

      const result2 = await stateAdapter.atomicUpdate!(traceId, key, (current: number | null) => {
        return (current || 0) + 20
      })

      const result3 = await stateAdapter.atomicUpdate!(traceId, key, (current: number | null) => {
        return (current || 0) + 30
      })

      expect(result1).toBe(10)
      expect(result2).toBe(30)
      expect(result3).toBe(60)

      // Verify final value
      const finalValue = await stateAdapter.get(traceId, key)
      expect(finalValue).toBe(60)
    })
  })

  describe('Concurrent Atomic Updates', () => {
    it('should handle concurrent atomic updates without race conditions', async () => {
      const traceId = 'test-trace'
      const key = 'counter'

      // Create 10 concurrent atomic updates, each adding 1
      const promises = Array.from({ length: 10 }, (_, i) =>
        stateAdapter.atomicUpdate!(traceId, key, (current: number | null) => {
          const currentValue = current || 0
          console.log(`Update ${i}: current=${currentValue}, adding 1`)
          return currentValue + 1
        })
      )

      const results = await Promise.all(promises)

      // All results should be different (sequential execution)
      const uniqueResults = new Set(results)
      expect(uniqueResults.size).toBe(10)

      // Results should be sequential: 1, 2, 3, ..., 10
      const sortedResults = results.sort((a, b) => a - b)
      expect(sortedResults).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

      // Final value should be 10
      const finalValue = await stateAdapter.get(traceId, key)
      expect(finalValue).toBe(10)
    })

    it('should handle concurrent atomic updates with different operations', async () => {
      const traceId = 'test-trace'
      const key = 'score'

      // Create concurrent updates: 5 additions of 10 each
      const addPromises = Array.from({ length: 5 }, (_, i) =>
        stateAdapter.atomicUpdate!(traceId, key, (current: number | null) => {
          const currentValue = current || 0
          console.log(`Add ${i}: current=${currentValue}, adding 10`)
          return currentValue + 10
        })
      )

      const results = await Promise.all(addPromises)

      // All results should be different and sequential
      const uniqueResults = new Set(results)
      expect(uniqueResults.size).toBe(5)

      // Results should be: 10, 20, 30, 40, 50
      const sortedResults = results.sort((a, b) => a - b)
      expect(sortedResults).toEqual([10, 20, 30, 40, 50])

      // Final value should be 50
      const finalValue = await stateAdapter.get(traceId, key)
      expect(finalValue).toBe(50)
    })

    it('should handle rapid successive updates to the same key', async () => {
      const traceId = 'test-trace'
      const key = 'rapid-counter'

      // Simulate the exact scenario from the integration test
      const rapidUpdates = Array.from({ length: 10 }, (_, i) => ({
        operation: 'add',
        value: 10,
        index: i
      }))

      const promises = rapidUpdates.map((update) =>
        stateAdapter.atomicUpdate!(traceId, key, (current: number | null) => {
          const currentValue = current || 0
          console.log(`Rapid update ${update.index}: current=${currentValue}, adding ${update.value}`)
          return currentValue + update.value
        })
      )

      const results = await Promise.all(promises)

      // All results should be different (sequential execution)
      const uniqueResults = new Set(results)
      expect(uniqueResults.size).toBe(10)

      // Results should be: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
      const sortedResults = results.sort((a, b) => a - b)
      expect(sortedResults).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])

      // Final value should be 100
      const finalValue = await stateAdapter.get(traceId, key)
      expect(finalValue).toBe(100)
    })
  })

  describe('Lock Mechanism', () => {
    it('should properly queue concurrent operations', async () => {
      const traceId = 'test-trace'
      const key = 'queue-test'

      const startTime = Date.now()
      const executionOrder: number[] = []

      // Create 5 concurrent operations that take different amounts of time
      const promises = Array.from({ length: 5 }, (_, i) =>
        stateAdapter.atomicUpdate!(traceId, key, (current: number | null) => {
          const currentValue = current || 0
          executionOrder.push(i)
          
          console.log(`Operation ${i} executed, current=${currentValue}`)
          return currentValue + 1
        })
      )

      const results = await Promise.all(promises)
      const endTime = Date.now()

      // All operations should have executed
      expect(results).toHaveLength(5)
      expect(executionOrder).toHaveLength(5)

      // Operations should have executed sequentially (not in parallel)
      // The execution order should be the same as the start order
      expect(executionOrder).toEqual([0, 1, 2, 3, 4])

      // Final value should be 5
      const finalValue = await stateAdapter.get(traceId, key)
      expect(finalValue).toBe(5)

      // Since operations are synchronous, they should complete quickly
      // The important thing is that they execute sequentially
      expect(endTime - startTime).toBeLessThan(100) // Should be very fast
    })

    it('should handle different keys independently', async () => {
      const traceId = 'test-trace'
      const key1 = 'key1'
      const key2 = 'key2'

      // Start operations on both keys simultaneously
      const promise1 = stateAdapter.atomicUpdate!(traceId, key1, (current: number | null) => {
        console.log('Key1 operation starting')
        return (current || 0) + 100
      })

      const promise2 = stateAdapter.atomicUpdate!(traceId, key2, (current: number | null) => {
        console.log('Key2 operation starting')
        return (current || 0) + 200
      })

      const [result1, result2] = await Promise.all([promise1, promise2])

      expect(result1).toBe(100)
      expect(result2).toBe(200)

      // Both keys should have their values set
      const value1 = await stateAdapter.get(traceId, key1)
      const value2 = await stateAdapter.get(traceId, key2)

      expect(value1).toBe(100)
      expect(value2).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should release locks even when update function throws', async () => {
      const traceId = 'test-trace'
      const key = 'error-test'

      // First operation that throws
      const errorPromise = stateAdapter.atomicUpdate!(traceId, key, (current: number | null) => {
        throw new Error('Test error')
      })

      // Second operation that should succeed
      const successPromise = stateAdapter.atomicUpdate!(traceId, key, (current: number | null) => {
        return (current || 0) + 1
      })

      // First operation should throw
      await expect(errorPromise).rejects.toThrow('Test error')

      // Second operation should succeed
      const result = await successPromise
      expect(result).toBe(1)

      // Value should be set correctly
      const finalValue = await stateAdapter.get(traceId, key)
      expect(finalValue).toBe(1)
    })

    it('should handle multiple errors in queue', async () => {
      const traceId = 'test-trace'
      const key = 'multi-error-test'

      // Create multiple operations, some throwing errors
      const promises = [
        stateAdapter.atomicUpdate!(traceId, key, (current: number | null) => {
          throw new Error('Error 1')
        }),
        stateAdapter.atomicUpdate!(traceId, key, (current: number | null) => {
          return (current || 0) + 1
        }),
        stateAdapter.atomicUpdate!(traceId, key, (current: number | null) => {
          throw new Error('Error 2')
        }),
        stateAdapter.atomicUpdate!(traceId, key, (current: number | null) => {
          return (current || 0) + 1
        })
      ]

      const results = await Promise.allSettled(promises)

      // First and third should be rejected
      expect(results[0].status).toBe('rejected')
      expect(results[2].status).toBe('rejected')

      // Second and fourth should be fulfilled
      expect(results[1].status).toBe('fulfilled')
      expect(results[3].status).toBe('fulfilled')

      if (results[1].status === 'fulfilled' && results[3].status === 'fulfilled') {
        expect(results[1].value).toBe(1)
        expect(results[3].value).toBe(2)
      }

      // Final value should be 2
      const finalValue = await stateAdapter.get(traceId, key)
      expect(finalValue).toBe(2)
    })
  })
})
