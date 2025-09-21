import { StepConfig, Handlers } from 'motia'

export const config: StepConfig = {
  name: 'StateMonitor',
  description: 'Monitors user status changes and triggers notifications',
  triggers: [{
    type: 'state',
    key: 'user.status',
    condition: (value: any) => value === 'active', // Only trigger when user becomes active
  }],
  emits: ['user.activated'],
  flows: ['user-management'],
}

export const handler: Handlers['StateMonitor'] = async (input, { emit, logger, state }) => {
  const { key, value, traceId } = input
  
  logger.info('User status changed', { key, value, traceId })
  
  // Emit an event when user becomes active
  await emit({
    topic: 'user.activated',
    data: {
      userId: traceId,
      status: value,
      activatedAt: new Date().toISOString(),
    },
  })
  
  logger.info('User activation event emitted', { userId: traceId, status: value })
}
