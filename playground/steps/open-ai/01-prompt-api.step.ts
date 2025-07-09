import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { messageSchema } from './00-open-ai-message.stream'

const inputSchema = z.object({
  message: z.string({ description: 'The message to send to OpenAI' }),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'OpenAiApi',
  description: 'Call OpenAI',
  path: '/open-ai/:threadId',
  method: 'POST',
  emits: ['openai-prompt'],
  flows: ['open-ai'],
  bodySchema: inputSchema,
  responseSchema: { 200: messageSchema },
}

export const handler: Handlers['OpenAiApi'] = async (req, { logger, emit, streams }) => {
  logger.info('[Call OpenAI] Received callOpenAi event', { message: req.body.message })

  const { message } = req.body
  const { threadId } = req.pathParams

  const userMessageId = crypto.randomUUID()
  const assistantMessageId = crypto.randomUUID()

  await streams.message.set(threadId, userMessageId, { message, from: 'user', status: 'created' })
  const assistantMessage = await streams.message.set(threadId, assistantMessageId, {
    message: '',
    from: 'assistant',
    status: 'created',
  })

  await emit({ topic: 'openai-prompt', data: { message, threadId, assistantMessageId } })

  return { status: 200, body: assistantMessage }
}
