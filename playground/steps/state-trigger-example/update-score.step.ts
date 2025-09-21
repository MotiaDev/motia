import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: StepConfig = {
  name: 'UpdateScore',
  description: 'API endpoint to update user score, which will trigger score monitors',
  triggers: [{
    type: 'api',
    path: '/update-score',
    method: 'POST',
  }],
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
  flows: ['user-management'],
}

export const handler: Handlers['UpdateScore'] = async (req, { emit, state, logger, traceId }) => {
  const { userId, scoreChange } = req.body
  
  logger.info('Updating user score', { userId, scoreChange, traceId })
  
  // Get current score
  const currentScore = (await state.get(userId, 'user.score')) || 0
  const newScore = currentScore + scoreChange
  
  // Set the new score - this will trigger any state triggers watching 'user.score'
  await state.set(userId, 'user.score', newScore)
  
  logger.info('User score updated', { userId, oldScore: currentScore, newScore })
  
  return {
    status: 200,
    body: {
      message: 'Score updated successfully',
      userId,
      newScore,
    },
  }
}
