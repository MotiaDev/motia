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
      oldScore: z.number(),
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
  const { userId, operation, value, reason } = req.body

  try {
    logger.info('Updating user score', { userId, operation, value, reason, traceId })

    // Get current score
    const currentScore = (await state.get(userId, 'user.score')) || 0
    let newScore: number

    // Perform the operation
    switch (operation) {
      case 'add':
        newScore = currentScore + value
        break
      case 'subtract':
        newScore = Math.max(0, currentScore - value) // Don't go below 0
        break
      case 'multiply':
        newScore = currentScore * value
        break
      case 'set':
        newScore = value
        break
      default:
        throw new Error(`Invalid operation: ${operation}`)
    }

    // Update the score - this will trigger score-related state monitors
    await state.set(userId, 'user.score', newScore)

    // Also update score history for tracking
    const scoreHistory = (await state.get(userId, 'user.score.history')) || []
    scoreHistory.push({
      operation,
      value,
      oldScore: currentScore,
      newScore,
      reason,
      timestamp: new Date().toISOString(),
    })
    await state.set(userId, 'user.score.history', scoreHistory)

    logger.info('User score updated', { userId, operation, oldScore: currentScore, newScore, reason })

    return {
      status: 200,
      body: {
        message: 'Score updated successfully',
        userId,
        oldScore: currentScore,
        newScore,
        operation,
      },
    }
  } catch (error: unknown) {
    logger.error('Score update failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      operation,
    })
    return {
      status: 400,
      body: { error: 'Score update failed' },
    }
  }
}
