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
    logger.info('Updating user score', { userId, operation, value, reason, traceId })

    // Use the simple update method for atomic read-modify-write
    // Create a function that can be serialized without closures
    const newScore = await state.update(userId, 'user.score', new Function('current', `
      const currentScore = current || 0;
      const operation = "${operation}";
      const value = ${value};
      
      switch (operation) {
        case 'add':
          return currentScore + value;
        case 'subtract':
          return Math.max(0, currentScore - value);
        case 'multiply':
          return currentScore * value;
        case 'set':
          return value;
        default:
          throw new Error('Invalid operation: ' + operation);
      }
    `) as (current: number | null) => number)

    // Update score history atomically
    await state.update(userId, 'user.score.history', new Function('history', `
      const scoreHistory = history || [];
      const operation = "${operation}";
      const value = ${value};
      const newScore = ${newScore};
      const reason = "${reason || ''}";
      
      scoreHistory.push({
        operation: operation,
        value: value,
        newScore: newScore,
        reason: reason,
        timestamp: new Date().toISOString()
      });
      return scoreHistory;
    `) as (history: unknown[] | null) => unknown[])

    logger.info('User score updated', { userId, operation, newScore, reason })

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
