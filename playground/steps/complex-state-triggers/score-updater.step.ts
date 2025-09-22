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
  const { userId, operation, value, reason } = req.body as {
    userId: string
    operation: 'add' | 'subtract' | 'multiply' | 'set'
    value: number
    reason?: string
  }

  try {
    logger.info('Updating user score', { userId, operation, value, reason, traceId })

    // Use atomic update to prevent race conditions
    let oldScore: number = 0
    let newScore: number = 0
    
    if ('atomicUpdate' in state && typeof state.atomicUpdate === 'function') {
      logger.info('Using atomic update for score', { userId, operation, value })
      
      // For RPC mode, we need to pass operation parameters instead of a function
      // Check if this is the RPC state manager by looking for the sender property
      if ('sender' in state) {
        // This is RPC mode - send operation parameters directly
        const result = await (state as any).sender.send('state.atomicUpdate', {
          traceId: userId,
          key: 'user.score',
          operation,
          value,
          reason
        })
        
        newScore = result
        
        // Get the old score for history (this is not atomic but acceptable for history)
        oldScore = (await state.get<number>(userId, 'user.score')) || 0
      } else {
        // This is direct mode - use the atomic update function
        const result = await state.atomicUpdate(userId, 'user.score', (currentScore: number | null) => {
          const current = currentScore || 0
          oldScore = current
          let newValue: number

          // Perform the operation
          switch (operation) {
            case 'add':
              newValue = current + value
              break
            case 'subtract':
              newValue = Math.max(0, current - value) // Don't go below 0
              break
            case 'multiply':
              newValue = current * value
              break
            case 'set':
              newValue = value
              break
            default:
              throw new Error(`Invalid operation: ${operation}`)
          }

          return newValue
        })

        newScore = result
      }

      // Score history is now updated atomically on the server side for RPC mode
      // For direct mode, we still need to update it separately
      if (!('sender' in state)) {
        const scoreHistory = (await state.get<any[]>(userId, 'user.score.history')) || []
        scoreHistory.push({
          operation,
          value,
          oldScore,
          newScore,
          reason,
          timestamp: new Date().toISOString(),
        })
        await state.set(userId, 'user.score.history', scoreHistory)
      }
    } else {
      // Fallback to regular set operation
      logger.info('Using fallback set operation for score', { userId, operation, value })
      const currentScore = (await state.get<number>(userId, 'user.score')) || 0
      oldScore = currentScore
      
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
      
      await state.set(userId, 'user.score', newScore)
      
      // Update score history
      const scoreHistory = (await state.get<any[]>(userId, 'user.score.history')) || []
      scoreHistory.push({
        operation,
        value,
        oldScore,
        newScore,
        reason,
        timestamp: new Date().toISOString(),
      })
      await state.set(userId, 'user.score.history', scoreHistory)
    }

    logger.info('User score updated', { userId, operation, oldScore, newScore, reason })

    return {
      status: 200,
      body: {
        message: 'Score updated successfully',
        userId,
        oldScore,
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
