import { StepConfig, Handlers } from 'motia'

export const config: StepConfig = {
  name: 'AutoTierPromoter',
  description: 'Automatically promotes users to higher tiers based on their score',
  triggers: [
    {
      type: 'state',
      key: 'user.score',
      condition: (value: unknown) => typeof value === 'number' && value >= 100,
    },
  ],
  emits: [],
  flows: ['user-lifecycle'],
  virtualSubscribes: ['user.score'],
  virtualEmits: [
    { topic: 'user.tier', label: 'User tier updated' },
    { topic: 'user.notifications', label: 'Promotion notification added' },
    { topic: 'user.inventory', label: 'Tier rewards added to inventory' },
  ],
}

export const handler: Handlers['AutoTierPromoter'] = async (input, { logger, state }) => {
  const { key, value, traceId } = input

  // Extract userId from the traceId (format: user_123_abc)
  const userId = traceId

  logger.info('Auto tier promoter triggered', { userId, score: value, traceId, key })


  try {
    // Get current tier
    const currentTier = (await state.get(userId, 'user.tier')) || 'bronze'

    // Determine what tier the user should be at based on score
    let targetTier = 'bronze'
    if (value >= 500) {
      targetTier = 'gold'
    } else if (value >= 100) {
      targetTier = 'silver'
    }

    // Only promote if the target tier is higher than current tier
    const tierOrder = { bronze: 0, silver: 1, gold: 2, platinum: 3 }
    const currentTierLevel = tierOrder[currentTier as keyof typeof tierOrder]
    const targetTierLevel = tierOrder[targetTier as keyof typeof tierOrder]

    if (targetTierLevel > currentTierLevel) {
      logger.info('Auto-promoting user tier', {
        userId,
        currentTier,
        targetTier,
        score: value,
      })

      // Use transaction to atomically update tier, add notification, and reward items
      const promotionTransaction = [
        { type: 'set', key: 'user.tier', value: targetTier },
        { type: 'push', key: 'user.notifications', value: {
          type: 'auto_promotion',
          message: `🚀 Auto-Promoted to ${targetTier.toUpperCase()} tier! Your score of ${value} earned you this promotion!`,
          timestamp: new Date().toISOString(),
          fromTier: currentTier,
          toTier: targetTier,
          score: value,
        }},
        { type: 'setField', key: 'user.profile', field: 'lastPromotion', value: new Date().toISOString() },
        { type: 'setField', key: 'user.profile', field: 'promotionCount', value: 1 },
        // Add tier-specific reward items to inventory
        { type: 'unshift', key: 'user.inventory', value: {
          id: `${targetTier}_badge`,
          type: 'badge',
          name: `${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)} Tier Badge`,
          tier: targetTier,
          timestamp: new Date().toISOString()
        }},
        { type: 'unshift', key: 'user.inventory', value: {
          id: `${targetTier}_reward`,
          type: 'reward',
          name: `${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)} Tier Reward`,
          value: value * 0.1, // 10% of score as reward value
          timestamp: new Date().toISOString()
        }}
      ]

      const transactionResult = await state.transaction(userId, promotionTransaction)

      logger.info('User auto-promoted atomically', {
        userId,
        fromTier: currentTier,
        toTier: targetTier,
        score: value,
        transactionSuccess: transactionResult.success,
        operationsCount: promotionTransaction.length,
        transactionResults: transactionResult.results.map((r: any) => ({ success: r.success, error: r.error }))
      })
    } else {
      logger.info('No tier promotion needed', {
        userId,
        currentTier,
        targetTier,
        score: value,
      })
    }
  } catch (error: unknown) {
    // Handle error silently
  }
}
