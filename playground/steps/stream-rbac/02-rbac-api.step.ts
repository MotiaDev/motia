import { faker } from '@faker-js/faker'
import type { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { messageSchema } from './00-stream-rbac-message.stream'

const inputSchema = z.object({
  message: z.string().describe('The message to trigger the RBAC stream'),
  streamName: z.enum(['rbac_message', 'rbac_message_python']),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'RbacStreamApi',
  description: 'Trigger RBAC stream with mock data',
  path: '/rbac-stream/:threadId',
  method: 'POST',
  emits: ['rbac-prompt'],
  flows: ['stream-rbac'],
  bodySchema: inputSchema,
  responseSchema: { 200: messageSchema },
}

export const handler: Handlers['RbacStreamApi'] = async (req, { logger, emit, streams }) => {
  logger.info('[RBAC Stream API] Received request', { message: req.body.message })

  const { message, streamName } = req.body
  const { threadId } = req.pathParams

  const userMessageId = faker.string.uuid()
  const assistantMessageId = faker.string.uuid()

  await streams[streamName].set(threadId, userMessageId, { message, from: 'user', status: 'created' })
  const assistantMessage = await streams[streamName].set(threadId, assistantMessageId, {
    message: '',
    from: 'assistant',
    status: 'created',
  })

  await emit({ topic: 'rbac-prompt', data: { message, threadId, assistantMessageId, streamName } })

  return { status: 200, body: assistantMessage }
}
