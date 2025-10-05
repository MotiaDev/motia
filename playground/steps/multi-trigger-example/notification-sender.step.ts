import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'

/**
 * API + EVENT + STATE TRIGGER EXAMPLE
 * 
 * This step demonstrates three different trigger types:
 * - API: Manual notification send
 * - Event: Triggered by system events
 * - State: Triggered by notification queue changes
 */
export const config: StepConfig = {
  name: 'NotificationSender',
  description: 'Sends notifications via multiple trigger mechanisms',
  
  triggers: [
    // API Trigger - Manual notification send
    {
      type: 'api',
      path: '/notifications/send',
      method: 'POST',
      description: 'Manually send a notification',
    },
    
    // Event Triggers - Triggered by various system events
    {
      type: 'event',
      topic: 'user.registered',
      description: 'Send welcome notification when user registers',
    },
    {
      type: 'event',
      topic: 'order.completed',
      description: 'Send order confirmation notification',
    },
    
    // State Trigger - Triggered when notification queue has pending items
    {
      type: 'state',
      key: 'notifications.queue',
      condition: (value: unknown) => {
        return Array.isArray(value) && value.length > 0
      },
      description: 'Process notification queue when items are added',
    },
  ],
  
  input: z.object({
    userId: z.string().optional(),
    message: z.string().optional(),
    type: z.enum(['email', 'sms', 'push']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  }),
  
  
  emits: ['notification.sent', 'notification.failed'],
  flows: ['multi-trigger-demo'],
  
  virtualEmits: [
    { topic: 'notification.sent', label: 'Notification sent successfully' },
    { topic: 'notification.failed', label: 'Notification failed to send' },
    { topic: 'notifications.queue', label: 'Notification queue updated' },
  ],
}

export const handler: Handlers['NotificationSender'] = async (input, { state, logger, emit }) => {
  const notificationId = `notif_${Date.now()}`
  const sentAt = new Date().toISOString()
  
  try {
    // Determine notification details
    const notification = {
      id: notificationId,
      userId: input.userId || 'system',
      message: input.message || 'Default notification message',
      type: input.type || 'email',
      priority: input.priority || 'medium',
      sentAt,
      status: 'sent',
    }
    
    logger.info('Sending notification', { 
      notificationId, 
      userId: notification.userId,
      type: notification.type,
    })
    
    // Store notification record
    await state.set('notifications', notificationId, notification)
    
    // Update notification stats
    const stats = (await state.get('notifications', 'stats') || {
      total: 0,
      byType: {},
    }) as { total: number; byType: Record<string, number> }
    stats.total += 1
    stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1
    await state.set('notifications', 'stats', stats)
    
    // Emit success event
    // @ts-expect-error - Multi-trigger steps have emit type issues that will be fixed later
    await emit({
      topic: 'notification.sent',
      data: notification,
    })
    
    logger.info('Notification sent successfully', { notificationId })
  } catch (error: unknown) {
    logger.error('Notification send failed', { error: String(error) })
    
    // @ts-expect-error - Multi-trigger steps have emit type issues that will be fixed later
    await emit({
      topic: 'notification.failed',
      data: {
        error: String(error),
        timestamp: new Date().toISOString(),
      },
    })
  }
}
