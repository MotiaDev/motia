import type { EventConfig, Handlers } from 'motia'
import { OpenAI } from 'openai'
import { z } from 'zod'

export const config: EventConfig = {
  type: 'event',
  name: 'CallOpenAi',
  description: 'Call OpenAI',
  subscribes: ['openai-prompt'],
  emits: [],
  input: z.object({
    message: z.string().describe('The message to send to OpenAI'),
    assistantMessageId: z.string().describe('The assistant message ID'),
    threadId: z.string().describe('The thread ID'),
  }),
  flows: ['open-ai'],
}

export const handler: Handlers['CallOpenAi'] = async (input, context) => {
  const { logger } = context
  const { message, assistantMessageId, threadId } = input
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_ })
  const assistantId = 'asst_dyEMCyKeZUnZrBBcnsE6diYf'

  logger.info('Starting OpenAI response')

  let openAiThreadId = await context.state.get<string>('openai-thread-id', threadId)
  const messageResult: string[] = []

  if (!openAiThreadId) {
    const thread = await openai.beta.threads.create()
    openAiThreadId = thread.id
    await context.state.set('openai-thread-id', threadId, openAiThreadId)
  }

  await openai.beta.threads.messages.create(openAiThreadId, { content: message, role: 'user' })

  const threadStream = openai.beta.threads.runs.stream(openAiThreadId, {
    assistant_id: assistantId,
    model: 'gpt-4o-mini',
  })

  for await (const chunk of threadStream) {
    if (chunk.event === 'thread.message.delta') {
      const delta = chunk.data.delta.content?.[0]

      if (delta?.type === 'text') {
        messageResult.push(delta.text?.value || '')

        await context.streams.message.set(threadId, assistantMessageId, {
          message: messageResult.join(''),
          from: 'assistant',
          status: 'pending',
        })
      }
    }
  }

  await context.streams.message.set(threadId, assistantMessageId, {
    message: messageResult.join(''),
    from: 'assistant',
    status: 'completed',
  })

  logger.info('OpenAI response completed')
}
