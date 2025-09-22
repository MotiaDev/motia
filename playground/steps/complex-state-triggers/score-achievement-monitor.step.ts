import { StepConfig, Handlers } from 'motia'

export const config: StepConfig = {
  name: 'ScoreAchievementMonitor',
  description: 'Monitors user score changes and unlocks achievements based on score thresholds',
  triggers: [
    {
      type: 'state',
      key: 'user.score',
      condition: (value: unknown) => typeof value === 'number' && value > 0,
    },
  ],
  emits: [],
  flows: ['user-lifecycle'],
  virtualSubscribes: ['user.score'],
  virtualEmits: [
    { topic: 'user.achievements', label: 'Achievements updated' },
    { topic: 'user.notifications', label: 'Achievement notification added' },
  ],
}

export const handler: Handlers['ScoreAchievementMonitor'] = async (input, { logger, state }) => {
  const { key, value, traceId } = input

  // Extract userId from the traceId (format: user_123_abc)
  const userId = traceId

  logger.info('Score achievement monitor triggered', { userId, score: value, traceId, key })


  try {
    // Get current achievements
    const currentAchievements = (await state.get(userId, 'user.achievements')) || []
    const newAchievements = []

    // Define achievement thresholds
    const achievements = [
      { id: 'first_score', name: 'First Score', threshold: 1, description: 'Earned your first point!' },
      { id: 'bronze_player', name: 'Bronze Player', threshold: 100, description: 'Reached 100 points' },
      { id: 'silver_player', name: 'Silver Player', threshold: 500, description: 'Reached 500 points' },
      { id: 'gold_player', name: 'Gold Player', threshold: 1000, description: 'Reached 1000 points' },
      { id: 'platinum_player', name: 'Platinum Player', threshold: 5000, description: 'Reached 5000 points' },
      { id: 'score_master', name: 'Score Master', threshold: 10000, description: 'Reached 10000 points' },
    ]

    // Check for new achievements
    for (const achievement of achievements) {
      const alreadyUnlocked = currentAchievements.some((a: unknown) => (a as { id: string }).id === achievement.id)

      if (!alreadyUnlocked && value >= achievement.threshold) {
        newAchievements.push({
          ...achievement,
          unlockedAt: new Date().toISOString(),
          scoreAtUnlock: value,
        })

        logger.info('New achievement unlocked', {
          userId,
          achievement: achievement.name,
          score: value,
          threshold: achievement.threshold,
        })
      }
    }

    // Update achievements if any new ones were unlocked
    if (newAchievements.length > 0) {
      const updatedAchievements = [...currentAchievements, ...newAchievements]
      await state.set(userId, 'user.achievements', updatedAchievements)

      // Add notification for new achievements
      const notifications = (await state.get(userId, 'user.notifications')) || []
      for (const achievement of newAchievements) {
        notifications.push({
          type: 'achievement',
          message: `🎉 Achievement Unlocked: ${achievement.name}! ${achievement.description}`,
          timestamp: new Date().toISOString(),
          achievementId: achievement.id,
        })
      }
      await state.set(userId, 'user.notifications', notifications)

      logger.info('Achievements updated', {
        userId,
        newAchievementsCount: newAchievements.length,
        totalAchievements: updatedAchievements.length,
      })
    }
  } catch (error: unknown) {
    // Handle error silently
  }
}
