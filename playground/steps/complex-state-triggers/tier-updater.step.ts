import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: StepConfig = {
  name: 'TierUpdater',
  description: 'API endpoint to update user tier based on score thresholds',
  triggers: [{ type: 'api', path: '/update-tier', method: 'POST' }],
  input: z.object({
    userId: z.string(),
    tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  }),
  responseSchema: {
    200: z.object({
      message: z.string(),
      userId: z.string(),
      oldTier: z.string(),
      newTier: z.string(),
    }),
    400: z.object({ error: z.string() }),
  },
  emits: [],
  flows: ['user-lifecycle'],
  virtualEmits: [{ topic: 'user.tier', label: 'User tier state changed' }],
}

export const handler: Handlers['TierUpdater'] = async (req, { state, logger, traceId }) => {
  const { userId, tier } = req.body

  try {
    logger.info('Updating user tier', { userId, tier, traceId })

    // Get current tier
    const currentTier = (await state.get(userId, 'user.tier')) || 'bronze'

    // Update the tier - this will trigger tier-related state monitors
    await state.set(userId, 'user.tier', tier)

    // Update tier history
    const tierHistory = (await state.get(userId, 'user.tier.history')) || []
    tierHistory.push({
      oldTier: currentTier,
      newTier: tier,
      timestamp: new Date().toISOString(),
    })
    await state.set(userId, 'user.tier.history', tierHistory)

    logger.info('User tier updated', { userId, oldTier: currentTier, newTier: tier })

    return {
      status: 200,
      body: {
        message: 'Tier updated successfully',
        userId,
        oldTier: currentTier,
        newTier: tier,
      },
    }
  } catch (error: unknown) {
    logger.error('Tier update failed', { error: error instanceof Error ? error.message : String(error), userId, tier })
    return {
      status: 400,
      body: { error: 'Tier update failed' },
    }
  }
}
