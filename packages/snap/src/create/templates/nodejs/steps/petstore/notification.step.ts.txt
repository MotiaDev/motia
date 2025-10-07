import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: EventConfig = {
  type: 'event',
  name: 'Notification',
  description: 'Sends notifications to users',
  flows: ['basic-tutorial'],
  subscribes: ['notification'],
  emits: [],
  input: z.object({
    templateId: z.string(),
    email: z.string(),
    templateData: z.record(z.string(), z.any()),
  }),
}

export const handler: Handlers['Notification'] = async (input, { traceId, logger }) => {
  const { email, ...data } = input
  const redactedEmail = email.replace(/(?<=.{2}).(?=.*@)/g, '*')

  logger.info('Processing Notification', { data, email: redactedEmail })

  /*
   * This represents a call to some sort of
   * notification service to indicate that a
   * new order has been placed
   */
  logger.info('New notification sent', {
    templateId: data.templateId,
    email: redactedEmail,
    templateData: data.templateData,
    traceId,
  })
}
