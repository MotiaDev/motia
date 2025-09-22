import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: StepConfig = {
  name: 'ScoreUpdater',
  description: 'API endpoint to update user score with various operations',
  triggers: [{ type: 'api', path: '/complex/update-score', method: 'POST' }],
  input: z.object({
    userId: z.string(),
    operation: z.enum(['add', 'subtract', 'multiply', 'set']),
    value: z.number(),
    reason: z.string().optional(),
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
  ],
}

export const handler: Handlers['ScoreUpdater'] = async (req, { state, logger, traceId }) => {
  const { userId, operation, value, reason } = req.body as {
    userId: string
    operation: 'add' | 'subtract' | 'multiply' | 'set'
    value: number
    reason?: string
  }

  try {
    let newScore: number

    // Use atomic operations for better performance and clarity
    switch (operation) {
      case 'add':
        newScore = await state.increment(userId, 'user.score', value)
        break
      case 'subtract':
        // For subtract, use get/set to avoid closure issues with RPC
        const currentScoreForSubtract = (await state.get(userId, 'user.score')) || 0
        newScore = Math.max(0, currentScoreForSubtract - value)
        await state.set(userId, 'user.score', newScore)
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
