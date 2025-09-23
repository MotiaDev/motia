import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: StepConfig = {
  name: 'ScoreUpdater',
  description: 'API endpoint to update user score with various operations',
  triggers: [{ type: 'api', path: '/complex/update-score', method: 'POST' }],
  input: z.object({
    userId: z.string(),
    operation: z.enum(['add', 'subtract', 'multiply', 'set', 'decrement', 'increment', 'bonus_round', 'inventory_reward', 'remove_last_item', 'check_item_exists', 'delete_profile_field', 'clear_achievements', 'compare_and_swap']),
    value: z.number(),
    reason: z.string().optional(),
    bonusItems: z.array(z.any()).optional(),
    fieldToDelete: z.string().optional(),
    expectedValue: z.number().optional(),
  }),
  responseSchema: {
    200: z.object({
      message: z.string(),
      userId: z.string(),
      newScore: z.number(),
      operation: z.string(),
    }),
    400: z.object({ error: z.string() }),
  },
  emits: [],
  flows: ['user-lifecycle'],
  virtualEmits: [
    { topic: 'user.score', label: 'User score updated' },
    { topic: 'user.score.history', label: 'Score history updated' },
    { topic: 'user.inventory', label: 'Inventory items added/removed' },
  ],
}

export const handler: Handlers['ScoreUpdater'] = async (req, { state, logger, traceId }) => {
  const { userId, operation, value, reason, bonusItems, fieldToDelete, expectedValue } = req.body as {
    userId: string
    operation: 'add' | 'subtract' | 'multiply' | 'set' | 'decrement' | 'increment' | 'bonus_round' | 'inventory_reward' | 'remove_last_item' | 'check_item_exists' | 'delete_profile_field' | 'clear_achievements' | 'compare_and_swap'
    value: number
    reason?: string
    bonusItems?: any[]
    fieldToDelete?: string
    expectedValue?: number
  }

  try {
    let newScore: number

    // Use atomic operations for better performance and clarity
    switch (operation) {
      case 'add':
      case 'increment':
        newScore = await state.increment(userId, 'user.score', value)
        break
      case 'subtract':
      case 'decrement':
        newScore = await state.decrement(userId, 'user.score', value)
        // Ensure score doesn't go below 0
        if (newScore < 0) {
          newScore = await state.set(userId, 'user.score', 0)
        }
        break
      case 'multiply':
        // For multiply, use get/set to avoid closure issues with RPC
        const currentScoreForMultiply = (await state.get(userId, 'user.score')) || 0
        newScore = currentScoreForMultiply * value
        await state.set(userId, 'user.score', newScore)
        break
      case 'set':
        newScore = await state.set(userId, 'user.score', value)
        break
      case 'bonus_round':
        // Bonus round: increment score and add bonus items to inventory
        newScore = await state.increment(userId, 'user.score', value)
        if (bonusItems && bonusItems.length > 0) {
          // Add bonus items to front of inventory using unshift
          for (const item of bonusItems) {
            await state.unshift(userId, 'user.inventory', item)
          }
        }
        break
      case 'inventory_reward':
        // Inventory reward: check if user has items, reward based on inventory
        const inventory = await state.get(userId, 'user.inventory') || []
        const rewardMultiplier = Math.min(inventory.length, 5) // Max 5x multiplier
        newScore = await state.increment(userId, 'user.score', value * rewardMultiplier)
        break
      case 'remove_last_item':
        // Remove last item from inventory using pop
        const removedItem = await state.pop(userId, 'user.inventory')
        newScore = await state.increment(userId, 'user.score', value)
        logger.info('Removed last item from inventory', { userId, removedItem, scoreBonus: value })
        break
      case 'check_item_exists':
        // Check if specific item exists using exists
        const itemExists = await state.exists(userId, `user.inventory.${value}`)
        newScore = await state.increment(userId, 'user.score', itemExists ? value : 0)
        logger.info('Checked item existence', { userId, itemId: value, exists: itemExists })
        break
      case 'delete_profile_field':
        // Delete specific profile field using deleteField
        if (!fieldToDelete) throw new Error('fieldToDelete required for delete_profile_field operation')
        await state.deleteField(userId, 'user.profile', fieldToDelete)
        newScore = await state.increment(userId, 'user.score', value)
        logger.info('Deleted profile field', { userId, field: fieldToDelete, scoreBonus: value })
        break
      case 'clear_achievements':
        // Clear all achievements using clear
        await state.clear(userId)
        newScore = await state.set(userId, 'user.score', value)
        logger.info('Cleared all user data', { userId, newScore: value })
        break
      case 'compare_and_swap':
        // Use compareAndSwap for optimistic locking
        if (expectedValue === undefined) throw new Error('expectedValue required for compare_and_swap operation')
        const success = await state.compareAndSwap(userId, 'user.score', expectedValue, value)
        newScore = await state.get(userId, 'user.score') || 0
        logger.info('Compare and swap operation', { userId, success, expectedValue, newValue: value, actualScore: newScore })
        break
      default:
        throw new Error(`Invalid operation: ${operation}`)
    }

    // Update score history atomically using push operation
    const historyEntry = {
      operation,
      value,
      newScore,
      reason: reason || '',
      timestamp: new Date().toISOString()
    }
    
    await state.push(userId, 'user.score.history', historyEntry)

    logger.info('Score updated successfully', { userId, operation, value, newScore })

    return {
      status: 200,
      body: {
        message: 'Score updated successfully',
        userId,
        newScore,
        operation,
      },
    }
  } catch (error: unknown) {
    logger.error('Score update failed', { userId, operation, value, error })
    return {
      status: 400,
      body: { error: 'Score update failed' },
    }
  }
}
