import { StepConfig, Handlers } from 'motia'

export const config: StepConfig = {
  name: 'DebugScoreMonitor',
  description: 'Debug monitor to test if state triggers are working for user.score',
  triggers: [{
    type: 'state',
    key: 'user.score',
    // No condition - should trigger on any score change
  }],
  emits: [],
  flows: ['user-lifecycle'],
  virtualSubscribes: ['user.score'],
}

export const handler: Handlers['DebugScoreMonitor'] = async (input, { logger, state }) => {
  const { key, value, traceId } = input
  
  // Extract userId from the state key (format: userId.user.score)
  const userId = key.split('.')[0]
  
  logger.info('DEBUG: Score changed!', { userId, score: value, traceId, key })
  
  // Log to console for test verification
  console.log('DEBUG: Score changed!', { userId, score: value, traceId, key })
}
