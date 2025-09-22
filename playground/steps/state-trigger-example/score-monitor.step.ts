import { StepConfig, Handlers } from 'motia'

export const config: StepConfig = {
  name: 'ScoreAchievementMonitor',
  description: 'Monitors user score changes and unlocks achievements when score exceeds 100',
  triggers: [
    {
      type: 'state',
      key: 'user.score',
      condition: (value: unknown) => typeof value === 'number' && value > 100, // Trigger when score exceeds 100
    },
  ],
  emits: [],
  flows: ['user-management'],
  virtualSubscribes: ['user.score'], // Shows it's listening to user.score state changes
}

export const handler: Handlers['ScoreAchievementMonitor'] = async (input, { logger, state }) => {
  const { key, value, traceId } = input

  // Extract userId from the state key (format: userId.user.score)
  const userId = key.split('.')[0]

  logger.info('User score changed', { userId, score: value, traceId, key })

  // Simulate unlocking achievement
  await new Promise((resolve) => setTimeout(resolve, 100)) // Simulate achievement processing

  // Store achievement data
  await state.set(userId, 'user.achievements.high_score', {
    score: value,
    unlockedAt: new Date().toISOString(),
    achievementType: 'high_score',
  })

  logger.info('High score achievement unlocked', {
    userId,
    score: value,
    storedKey: `${userId}.user.achievements.high_score`,
  })
}
