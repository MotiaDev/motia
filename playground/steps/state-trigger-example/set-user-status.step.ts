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
  input: z.object({
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
  emits: [],
  flows: ['user-management'],
  virtualEmits: [{ topic: 'user.status', label: 'User status state changed' }], // Shows it's changing user.status state
}

export const handler: Handlers['SetUserStatus'] = async (req, { emit, state, logger, traceId }) => {
  const { userId, status } = req.body
  
  logger.info('Setting user status', { userId, status, traceId })
  
  // Set the state - this will trigger any state triggers watching 'user.status'
  await state.set(userId, 'user.status', status)
  
  logger.info('User status updated', { userId, status })
  
  return {
    status: 200,
    body: {
      message: 'User status updated successfully',
      userId,
      status,
    },
  }
}
