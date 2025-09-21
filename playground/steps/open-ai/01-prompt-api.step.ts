import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'
import { messageSchema } from './00-open-ai-message.stream'
import { randomUUID } from 'crypto'

const inputSchema = z.object({
  message: z.string({ description: 'The message to send to OpenAI' }),
})

export const config: StepConfig = {
  name: 'OpenAiApi',
  description: 'Call OpenAI',
  triggers: [{
    type: 'api',
    path: '/open-ai/:threadId',
    method: 'POST',
  }],
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

  const userMessageId = randomUUID()
  const assistantMessageId = randomUUID()

  await streams.message.set(threadId, userMessageId, { message, from: 'user', status: 'created' })
  const assistantMessage = await streams.message.set(threadId, assistantMessageId, {
    message: '',
    from: 'assistant',
    status: 'created',
  })

  await emit({ topic: 'openai-prompt', data: { message, threadId, assistantMessageId } })

  return { status: 200, body: assistantMessage }
}
