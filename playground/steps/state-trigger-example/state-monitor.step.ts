import { StepConfig, Handlers } from 'motia'

export const config: StepConfig = {
  name: 'UserStatusMonitor',
  description: 'Monitors user status changes and sends welcome email when user becomes active',
  triggers: [
    {
      type: 'state',
      key: 'user.status',
      condition: (value: unknown) => value === 'active', // Only trigger when user becomes active
    },
  ],
  emits: [],
  flows: ['user-management'],
  virtualSubscribes: ['user.status'], // Shows it's listening to user.status state changes
}

export const handler: Handlers['UserStatusMonitor'] = async (input, { logger, state }) => {
  const { key, value, traceId } = input

  // Extract userId from the state key (format: userId.user.status)
  const userId = key.split('.')[0]

  logger.info('User status changed', { userId, status: value, traceId, key })

  // Simulate sending welcome email when user becomes active
  await new Promise((resolve) => setTimeout(resolve, 100)) // Simulate email sending

  // Store that welcome email was sent
  await state.set(userId, 'user.welcome.email.sent', {
    sentAt: new Date().toISOString(),
    status: value,
  })

  logger.info('Welcome email sent to user', { userId, status: value, storedKey: `${userId}.user.welcome.email.sent` })
}
