import { describe, expect, it } from 'vitest'
import { TriggerAction } from '../src/index'
import { execute, iii, sleep } from './utils'

describe('Queue Integration', () => {
  it('enqueue delivers message to registered function', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: test code
    const received: any[] = []

    const consumer = iii.registerFunction(
      { id: 'test.queue.consumer' },
      // biome-ignore lint/suspicious/noExplicitAny: test code
      async (input: any) => {
        received.push(input)
        return { ok: true }
      },
    )

    await sleep(300)

    try {
      const result = await iii.trigger({
        function_id: 'test.queue.consumer',
        payload: { order: 'pizza' },
        action: TriggerAction.Enqueue({ queue: 'test-orders' }),
      })

      expect(result).toHaveProperty('messageReceiptId')
      expect(typeof result.messageReceiptId).toBe('string')

      await execute(async () => {
        if (received.length === 0) {
          throw new Error('Consumer has not received the message yet')
        }
      })

      expect(received).toHaveLength(1)
      expect(received[0]).toMatchObject({ order: 'pizza' })
    } finally {
      consumer.unregister()
    }
  })

  it('void trigger returns undefined immediately', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: test code
    const calls: any[] = []

    const consumer = iii.registerFunction(
      { id: 'test.queue.void-consumer' },
      // biome-ignore lint/suspicious/noExplicitAny: test code
      async (input: any) => {
        calls.push(input)
        return { ok: true }
      },
    )

    await sleep(300)

    try {
      const result = await iii.trigger({
        function_id: 'test.queue.void-consumer',
        payload: { msg: 'fire' },
        action: TriggerAction.Void(),
      })

      expect(result).toBeUndefined()

      await execute(async () => {
        if (calls.length === 0) {
          throw new Error('Consumer has not been called yet')
        }
      })

      expect(calls).toHaveLength(1)
      expect(calls[0]).toMatchObject({ msg: 'fire' })
    } finally {
      consumer.unregister()
    }
  })

  it('enqueue multiple messages all get processed', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: test code
    const received: any[] = []
    const messageCount = 5

    const consumer = iii.registerFunction(
      { id: 'test.queue.multi-consumer' },
      // biome-ignore lint/suspicious/noExplicitAny: test code
      async (input: any) => {
        received.push(input)
        return { ok: true }
      },
    )

    await sleep(300)

    try {
      for (let i = 0; i < messageCount; i++) {
        await iii.trigger({
          function_id: 'test.queue.multi-consumer',
          payload: { index: i, value: `msg-${i}` },
          action: TriggerAction.Enqueue({ queue: 'test-multi' }),
        })
      }

      await execute(async () => {
        if (received.length < messageCount) {
          throw new Error(`Only ${received.length}/${messageCount} messages received`)
        }
      })

      expect(received).toHaveLength(messageCount)

      for (let i = 0; i < messageCount; i++) {
        expect(received).toContainEqual(expect.objectContaining({ index: i, value: `msg-${i}` }))
      }
    } finally {
      consumer.unregister()
    }
  })

  it('chained enqueue - function A enqueues to function B', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: test code
    const chainedReceived: any[] = []

    const functionB = iii.registerFunction(
      { id: 'test.queue.chain-b' },
      // biome-ignore lint/suspicious/noExplicitAny: test code
      async (input: any) => {
        chainedReceived.push(input)
        return { ok: true }
      },
    )

    const functionA = iii.registerFunction(
      { id: 'test.queue.chain-a' },
      // biome-ignore lint/suspicious/noExplicitAny: test code
      async (input: any) => {
        await iii.trigger({
          function_id: 'test.queue.chain-b',
          payload: { ...input, chained: true },
          action: TriggerAction.Enqueue({ queue: 'test-chain' }),
        })
        return input
      },
    )

    await sleep(300)

    try {
      await iii.trigger({
        function_id: 'test.queue.chain-a',
        payload: { origin: 'test', data: 42 },
        action: TriggerAction.Enqueue({ queue: 'test-chain-entry' }),
      })

      await execute(async () => {
        if (chainedReceived.length === 0) {
          throw new Error('Function B has not received the chained message yet')
        }
      })

      expect(chainedReceived).toHaveLength(1)
      expect(chainedReceived[0]).toMatchObject({ origin: 'test', data: 42, chained: true })
    } finally {
      functionA.unregister()
      functionB.unregister()
    }
  })
})
