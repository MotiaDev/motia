import { StepConfig, Handlers } from 'motia'

export const config: StepConfig = {
  name: 'ScoreMonitor',
  description: 'Monitors user score changes and triggers achievements',
  triggers: [
    {
      type: 'state',
      key: 'user.score',
      condition: (value: any) => value >= 1000, // Trigger when score reaches 1000+
    },
    {
      type: 'state',
      key: 'user.score',
      condition: (value: any) => value >= 5000, // Trigger when score reaches 5000+
    },
  ],
  emits: ['achievement.unlocked'],
  flows: ['user-management'],
}

export const handler: Handlers['ScoreMonitor'] = async (input, { emit, logger, state }) => {
  const { key, value, traceId } = input
  
  logger.info('User score changed', { key, value, traceId })
  
  let achievement = ''
  if (value >= 5000) {
    achievement = 'master'
  } else if (value >= 1000) {
    achievement = 'expert'
  }
  
  if (achievement) {
    await emit({
      topic: 'achievement.unlocked',
      data: {
        userId: traceId,
        achievement,
        score: value,
        unlockedAt: new Date().toISOString(),
      },
    })
    
    logger.info('Achievement unlocked', { userId: traceId, achievement, score: value })
  }
}
