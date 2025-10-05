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
      topic: 'data.processed',
      description: 'Send notification when data processing completes (flows from DataProcessor)',
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
    dataId: z.string().optional(),
    message: z.string().optional(),
    type: z.enum(['email', 'sms', 'push']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
    status: z.string().optional(),
  }),
  
  
  emits: [
    { topic: 'notification.sent', label: 'Notification sent successfully' },
    { topic: 'notification.failed', label: 'Notification failed to send' },
  ],
  flows: ['multi-trigger-demo'],
  
  virtualEmits: [
    { topic: 'notification.sent', label: 'Notification sent successfully' },
    { topic: 'notification.failed', label: 'Notification failed to send' },
    { topic: 'notifications.queue', label: 'Notification queue updated' },
  ],
}

export const handler: Handlers['NotificationSender'] = async (inputOrReq, { state, logger, emit }) => {
  // Extract input from either direct input or API request body
  const input = 'body' in inputOrReq ? inputOrReq.body : inputOrReq
  const isApiTrigger = 'body' in inputOrReq
  
  const notificationId = `notif_${Date.now()}`
  const sentAt = new Date().toISOString()
  
  // Determine notification source
  const source = input.dataId ? 'data_processed' : (input.userId ? 'direct' : 'system')
  const message = input.message || (input.dataId ? `Data ${input.dataId} processed successfully` : 'System notification')
  
  logger.info('Sending notification', { 
    notificationId, 
    source,
    type: input.type || 'email',
  })
  
  // Emit success event (fire and forget)
  emit({
    topic: 'notification.sent',
    data: {
      id: notificationId,
      source,
      message,
      type: input.type || 'email',
      sentAt,
    },
  })
  
  logger.info('Notification sent successfully', { notificationId, source })
  
  // Return API response only if triggered via API
  if (isApiTrigger) {
    return {
      status: 200,
      body: {
        message: 'Notification sent successfully',
        notificationId,
        sentAt,
      },
    }
  }
}
