import { EventConfig, Handlers } from 'motia'
import { OpenAI } from 'openai'
import { z } from 'zod'

export const config: EventConfig = {
  type: 'event',
  name: 'CallOpenAi',
  description: 'Call OpenAI',
  subscribes: ['openai-prompt'],
  emits: [{ topic: 'openai-response', label: 'OpenAI Response' }],
  input: z.object({
    message: z.string({ description: 'The message to send to OpenAI' }),
  }),
  flows: ['open-ai'],
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_ })

export const handler: Handlers['CallOpenAi'] = async (input, context) => {
  const { logger, traceId } = context

  logger.info('[Call OpenAI] Received callOpenAi event', input)

  const result = await openai.chat.completions.create({
    messages: [{ role: 'system', content: input.message }],
    model: 'gpt-4o-mini',
    stream: true,
  })

  const messages: string[] = []

  for await (const chunk of result) {
    messages.push(chunk.choices[0].delta.content ?? '')

    await context.streams.openai.update(traceId, {
      message: messages.join(''),
    })
  }

  logger.info('[Call OpenAI] OpenAI response', result)
}
