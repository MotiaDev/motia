import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: StepConfig = {
  name: 'ConcurrentUpdateHandler',
  description: 'Handles concurrent updates using compare-and-swap for optimistic locking',
  triggers: [{ type: 'api', path: '/complex/concurrent-update', method: 'POST' }],
  input: z.object({
    userId: z.string(),
    updateType: z.enum(['score', 'tier', 'inventory', 'preferences']),
    expectedValue: z.any().optional(),
    newValue: z.any(),
    retryCount: z.number().default(0),
  }),
  responseSchema: {
    200: z.object({
      message: z.string(),
      userId: z.string(),
      updateType: z.string(),
      success: z.boolean(),
      currentValue: z.any(),
      retryCount: z.number(),
    }),
    409: z.object({ 
      error: z.string(),
      currentValue: z.any(),
      retryCount: z.number(),
    }),
  },
  emits: [],
  flows: ['user-lifecycle'],
  virtualEmits: [
    { topic: 'user.concurrent', label: 'User concurrent update completed' },
  ],
}

export const handler: Handlers['ConcurrentUpdateHandler'] = async (req, { state, logger, traceId }) => {
  const { userId, updateType, expectedValue, newValue, retryCount } = req.body as {
    userId: string
    updateType: 'score' | 'tier' | 'inventory' | 'preferences'
    expectedValue?: any
    newValue: any
    retryCount: number
  }

  try {
    let key: string
    let currentValue: any
    let expected: any

    // Determine the key and get current value
    switch (updateType) {
      case 'score':
        key = 'user.score'
        currentValue = await state.get(userId, key) || 0
        expected = expectedValue !== undefined ? expectedValue : currentValue
        break
      case 'tier':
        key = 'user.tier'
        currentValue = await state.get(userId, key) || 'bronze'
        expected = expectedValue !== undefined ? expectedValue : currentValue
        break
      case 'inventory':
        key = 'user.inventory'
        currentValue = await state.get(userId, key) || []
        expected = expectedValue !== undefined ? expectedValue : currentValue
        break
      case 'preferences':
        key = 'user.preferences'
        currentValue = await state.get(userId, key) || {}
        expected = expectedValue !== undefined ? expectedValue : currentValue
        break
      default:
        throw new Error(`Invalid update type: ${updateType}`)
    }

    // Attempt compare-and-swap operation
    const success = await state.compareAndSwap(userId, key, expected, newValue)
    
    if (success) {
      // Success! Log the update and add to activity history
      const activityEntry = {
        type: 'concurrent_update',
        updateType,
        timestamp: new Date().toISOString(),
        retryCount,
        success: true
      }
      
      await state.push(userId, 'user.activity.history', activityEntry)
      
      logger.info('Concurrent update succeeded', {
        userId,
        updateType,
        key,
        expected,
        newValue,
        retryCount,
      })

      return {
        status: 200,
        body: {
          message: `Concurrent update for ${updateType} succeeded`,
          userId,
          updateType,
          success: true,
          currentValue: newValue,
          retryCount,
        },
      }
    } else {
      // Failed due to concurrent modification
      const currentValueAfter = await state.get(userId, key)
      
      logger.info('Concurrent update failed - value changed', {
        userId,
        updateType,
        key,
        expected,
        newValue,
        currentValueAfter,
        retryCount,
      })

      return {
        status: 409,
        body: {
          error: `Concurrent update failed - ${updateType} value changed during update`,
          currentValue: currentValueAfter,
          retryCount,
        },
      }
    }
  } catch (error: unknown) {
    logger.error('Concurrent update handler failed', { userId, updateType, error })
    return {
      status: 400,
      body: { error: 'Concurrent update handler failed' },
    }
  }
}
