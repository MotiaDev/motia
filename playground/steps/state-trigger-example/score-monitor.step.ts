import { StepConfig, Handlers } from 'motia'

export const config: StepConfig = {
  name: 'ScoreMonitor',
  description: 'Monitors user score changes and triggers achievements',
  triggers: [{
    type: 'state',
    key: 'user.score',
    condition: (value: any) => typeof value === 'number' && value > 100, // Trigger when score exceeds 100
  }],
  emits: ['user.score.high'],
  flows: ['user-achievements'],
}

export const handler: Handlers['ScoreMonitor'] = async (input, { emit, logger, state }) => {
  const { key, value, traceId } = input
  
  logger.info('User score changed', { key, value, traceId })
  
  // Emit an event when score exceeds 100
  await emit({
    topic: 'user.score.high',
    data: {
      userId: traceId,
      score: value,
    },
  })
  
  logger.info('High score achievement event emitted', { userId: traceId, score: value })
}
