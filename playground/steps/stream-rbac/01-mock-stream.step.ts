import { faker } from '@faker-js/faker'
import type { EventConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: EventConfig = {
  type: 'event',
  name: 'MockRbacStream',
  description: 'Mock streaming behavior using faker.js',
  subscribes: ['rbac-prompt'],
  emits: [],
  input: z.object({
    message: z.string().describe('The message that triggered the stream'),
    assistantMessageId: z.string().describe('The assistant message ID'),
    threadId: z.string().describe('The thread ID'),
    streamName: z.enum(['rbac_message', 'rbac_message_python']),
  }),
  flows: ['stream-rbac'],
}

export const handler = async (
  input: Parameters<Handlers['MockRbacStream']>[0],
  context: Parameters<Handlers['RbacStreamApi']>[1],
) => {
  const { logger } = context
  const { assistantMessageId, threadId, streamName } = input

  logger.info('Starting mock RBAC stream')

  // Generate a random paragraph using faker
  const fullMessage = faker.lorem.paragraphs(3, '\n\n')

  // Split into words for chunking
  const words = fullMessage.split(' ')
  const messageResult: string[] = []

  // Set initial status
  await context.streams[streamName].set(threadId, assistantMessageId, {
    message: '',
    from: 'assistant',
    status: 'created',
  })

  // Stream words with delays to simulate real-time streaming
  for (const word of words) {
    messageResult.push(word)

    await context.streams[streamName].set(threadId, assistantMessageId, {
      message: messageResult.join(' '),
      from: 'assistant',
      status: 'pending',
    })

    // Random delay between 50-100ms to simulate streaming
    const delay = Math.floor(Math.random() * 50) + 50
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  // Set final completed status
  await context.streams[streamName].set(threadId, assistantMessageId, {
    message: messageResult.join(' '),
    from: 'assistant',
    status: 'completed',
  })

  logger.info('Mock RBAC stream completed')
}
