import { StepConfig, Handlers } from 'motia'

export const config: StepConfig = {
  name: 'TierMonitor',
  description: 'Monitors user tier changes and provides tier-specific benefits',
  triggers: [
    {
      type: 'state',
      key: 'user.tier',
      condition: (value: unknown) =>
        typeof value === 'string' && ['bronze', 'silver', 'gold', 'platinum'].includes(value),
    },
  ],
  emits: [],
  flows: ['user-lifecycle'],
  virtualSubscribes: ['user.tier'],
  virtualEmits: [
    { topic: 'user.benefits', label: 'User benefits updated' },
    { topic: 'user.notifications', label: 'Tier upgrade notification added' },
  ],
}

export const handler: Handlers['TierMonitor'] = async (input, { logger, state }) => {
  const { key, value, traceId } = input

  // Extract userId from the traceId (format: user_123_abc)
  const userId = traceId

  logger.info('Tier monitor triggered', { userId, tier: value, traceId, key })

  try {
    // Define tier benefits
    const tierBenefits = {
      bronze: { multiplier: 1.0, dailyBonus: 10, maxNotifications: 5 },
      silver: { multiplier: 1.2, dailyBonus: 25, maxNotifications: 10 },
      gold: { multiplier: 1.5, dailyBonus: 50, maxNotifications: 20 },
      platinum: { multiplier: 2.0, dailyBonus: 100, maxNotifications: 50 },
    }

    const benefits = tierBenefits[value as keyof typeof tierBenefits]

    if (benefits) {
      // Update user benefits
      await state.set(userId, 'user.benefits', {
        tier: value,
        scoreMultiplier: benefits.multiplier,
        dailyBonus: benefits.dailyBonus,
        maxNotifications: benefits.maxNotifications,
        updatedAt: new Date().toISOString(),
      })

      // Add tier upgrade notification
      const notifications = (await state.get(userId, 'user.notifications')) || []
      notifications.push({
        type: 'tier_upgrade',
        message: `🌟 Tier Upgraded to ${value.toUpperCase()}! You now get ${benefits.multiplier}x score multiplier and ${benefits.dailyBonus} daily bonus points!`,
        timestamp: new Date().toISOString(),
        tier: value,
      })

      // Trim notifications to max allowed
      if (notifications.length > benefits.maxNotifications) {
        notifications.splice(0, notifications.length - benefits.maxNotifications)
      }

      await state.set(userId, 'user.notifications', notifications)

      logger.info('Tier Upgraded', {
        userId,
        tier: value,
        multiplier: benefits.multiplier,
        dailyBonus: benefits.dailyBonus,
      })
    }
  } catch (error: unknown) {
    logger.error('Tier monitor failed', {
      userId,
      tier: value,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
