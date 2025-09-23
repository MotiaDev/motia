import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: StepConfig = {
  name: 'UpdateUserScore',
  description: 'API endpoint to update user score, which will trigger score monitors',
  triggers: [
    {
      type: 'api',
      path: '/update-score',
      method: 'POST',
    },
  ],
  input: z.object({
    userId: z.string(),
    scoreChange: z.number(),
  }),
  responseSchema: {
    200: z.object({
      message: z.string(),
      userId: z.string(),
      newScore: z.number(),
    }),
  },
  emits: [],
  flows: ['user-management'],
  virtualEmits: [{ topic: 'user.score', label: 'User score state changed' }], // Shows it's changing user.score state
}

export const handler: Handlers['UpdateUserScore'] = async (req, { state, logger, traceId }) => {
  const { userId, scoreChange } = req.body

  logger.info('Updating user score', { userId, scoreChange, traceId })

  // Use atomic increment operation for better performance and consistency
  const newScore = await state.increment(userId, 'user.score', scoreChange)

  logger.info('User score updated', { userId, scoreChange, newScore })

  return {
    status: 200,
    body: {
      message: 'Score updated successfully',
      userId,
      newScore,
    },
  }
}
