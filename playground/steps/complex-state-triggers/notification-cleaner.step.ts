import { StepConfig, Handlers } from 'motia'

export const config: StepConfig = {
  name: 'NotificationCleaner',
  description: 'Cleans up old notifications when new ones are added to prevent overflow',
  triggers: [
    {
      type: 'state',
      key: 'user.notifications',
      condition: (value: unknown) => Array.isArray(value) && value.length > 0,
    },
  ],
  emits: [],
  flows: ['user-lifecycle'],
  virtualSubscribes: ['user.notifications'],
}

export const handler: Handlers['NotificationCleaner'] = async (input, { logger, state }) => {
  const { key, value, traceId } = input

  // Extract userId from the traceId (format: user_123_abc)
  const userId = traceId

  logger.info('Notification cleaner triggered', { userId, notificationCount: value.length, traceId, key })


  try {
    // Get user benefits to determine max notifications
    const benefits = await state.get(userId, 'user.benefits')
    const maxNotifications = benefits?.maxNotifications || 10 // Default to 10

    if (value.length > maxNotifications) {
      // Sort notifications by timestamp (newest first)
      const sortedNotifications = value.sort((a: unknown, b: unknown) => {
        const aTime = (a as { timestamp: string }).timestamp
        const bTime = (b as { timestamp: string }).timestamp
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })

      // Keep only the most recent notifications
      const trimmedNotifications = sortedNotifications.slice(0, maxNotifications)
      const removedCount = value.length - trimmedNotifications.length

      // Use batch operations to atomically update notifications, track cleanup stats, and manage inventory
      const cleanupOperations = [
        { type: 'set', key: 'user.notifications', value: trimmedNotifications },
        { type: 'increment', key: 'user.stats.notificationsCleaned', value: removedCount },
        { type: 'setField', key: 'user.profile', field: 'lastCleanup', value: new Date().toISOString() },
        // Add cleanup reward to inventory if significant cleanup occurred
        ...(removedCount > 5 ? [{
          type: 'unshift' as const,
          key: 'user.inventory',
          value: {
            id: 'cleanup_reward',
            type: 'reward',
            name: 'Cleanup Reward',
            description: `Cleaned up ${removedCount} old notifications`,
            value: removedCount * 10, // 10 points per cleaned notification
            timestamp: new Date().toISOString()
          }
        }] : [])
      ]

      const cleanupResult = await state.batch(userId, cleanupOperations)

      logger.info('Notifications cleaned up atomically', {
        userId,
        originalCount: value.length,
        trimmedCount: trimmedNotifications.length,
        removedCount,
        maxAllowed: maxNotifications,
        batchSuccess: cleanupResult.results.every(r => r.success),
      })
    } else {
      logger.info('No notification cleanup needed', {
        userId,
        currentCount: value.length,
        maxAllowed: maxNotifications,
      })
    }
  } catch (error: unknown) {
    // Handle error silently
  }
}
