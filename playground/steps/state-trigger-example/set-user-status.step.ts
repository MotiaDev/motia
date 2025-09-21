import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: StepConfig = {
  name: 'SetUserStatus',
  description: 'API endpoint to set user status, which will trigger state monitors',
  triggers: [{
    type: 'api',
    path: '/set-user-status',
    method: 'POST',
  }],
  method: 'POST',
  path: '/set-user-status',
  bodySchema: z.object({
    userId: z.string(),
    status: z.enum(['inactive', 'active', 'suspended']),
  }),
  responseSchema: {
    200: z.object({
      message: z.string(),
      userId: z.string(),
      status: z.string(),
    }),
  },
  emits: ['user.status.changed'],
  flows: ['user-management'],
}

export const handler: Handlers['SetUserStatus'] = async (req, { emit, state, logger, traceId }) => {
  const { userId, status } = req.body
  
  logger.info('Setting user status', { userId, status, traceId })
  
  // Set the state - this will trigger any state triggers watching 'user.status'
  await state.set(userId, 'user.status', status)
  
  // Also emit an event for other event-based steps
  await emit({
    topic: 'user.status.changed',
    data: {
      userId,
      status,
      changedAt: new Date().toISOString(),
    },
  })
  
  logger.info('User status updated and events emitted', { userId, status })
  
  return {
    status: 200,
    body: {
      message: 'User status updated successfully',
      userId,
      status,
    },
  }
}
