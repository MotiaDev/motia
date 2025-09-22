import { StepConfig, Handlers } from 'motia'

export const config: StepConfig = {
  name: 'AutoTierPromoter',
  description: 'Automatically promotes users to higher tiers based on their score',
  triggers: [{
    type: 'state',
    key: 'user.score',
    condition: (value: any) => typeof value === 'number' && value >= 100
  }],
  emits: [],
  flows: ['user-lifecycle'],
  virtualSubscribes: ['user.score'],
}

export const handler: Handlers['AutoTierPromoter'] = async (input, { logger, state }) => {
  const { key, value, traceId } = input
  
  // Extract userId from the state key (format: userId.user.score)
  const userId = key.split('.')[0]
  
  // Debug logging
  console.log('DEBUG: AutoTierPromoter triggered!', { userId, score: value, traceId, key })
  console.log('DEBUG: State key parts:', key.split('.'))
  
  logger.info('Auto tier promoter triggered', { userId, score: value, traceId, key })
  
  try {
    // Get current tier
    const currentTier = (await state.get(userId, 'user.tier')) || 'bronze'
    
    // Define tier promotion thresholds
    const tierThresholds = {
      bronze: 100,   // bronze -> silver
      silver: 500,   // silver -> gold  
      gold: 1000,    // gold -> platinum
      platinum: 5000 // platinum stays platinum
    }
    
    // Determine what tier the user should be at based on score
    let targetTier = 'bronze'
    if (value >= tierThresholds.platinum) {
      targetTier = 'platinum'
    } else if (value >= tierThresholds.gold) {
      targetTier = 'gold'
    } else if (value >= tierThresholds.silver) {
      targetTier = 'silver'
    }
    
    // Only promote if the target tier is higher than current tier
    const tierOrder = { bronze: 0, silver: 1, gold: 2, platinum: 3 }
    const currentTierLevel = tierOrder[currentTier as keyof typeof tierOrder]
    const targetTierLevel = tierOrder[targetTier as keyof typeof tierOrder]
    
    console.log('DEBUG: Tier promotion check', { 
      userId, 
      currentTier, 
      targetTier, 
      currentTierLevel, 
      targetTierLevel, 
      score: value 
    })
    
    if (targetTierLevel > currentTierLevel) {
      logger.info('Auto-promoting user tier', { 
        userId, 
        currentTier, 
        targetTier, 
        score: value 
      })
      
      // Update the tier - this will trigger the tier monitor
      await state.set(userId, 'user.tier', targetTier)
      
      // Add promotion notification
      const notifications = (await state.get(userId, 'user.notifications')) || []
      notifications.push({
        type: 'auto_promotion',
        message: `🚀 Auto-Promoted to ${targetTier.toUpperCase()} tier! Your score of ${value} earned you this promotion!`,
        timestamp: new Date().toISOString(),
        fromTier: currentTier,
        toTier: targetTier,
        score: value
      })
      await state.set(userId, 'user.notifications', notifications)
      
      logger.info('User auto-promoted', { 
        userId, 
        fromTier: currentTier, 
        toTier: targetTier, 
        score: value 
      })
    } else {
      logger.info('No tier promotion needed', { 
        userId, 
        currentTier, 
        targetTier, 
        score: value 
      })
    }
    
  } catch (error: any) {
    logger.error('Auto tier promoter failed', { 
      userId, 
      score: value, 
      error: error.message 
    })
  }
}
