import { EventConfig, Handlers } from 'motia'
import { OpenAI } from 'openai'
import { z } from 'zod'

export const config: EventConfig = {
  type: 'event',
  name: 'CallOpenAi',
  description: 'Call OpenAI',
  subscribes: ['openai-prompt'],
  emits: [],
  input: z.object({
    message: z.string({ description: 'The message to send to OpenAI' }),
  }),
  flows: ['open-ai'],
}

export const handler: Handlers['CallOpenAi'] = async (input, context) => {
  const { logger, traceId } = context
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_ })

  logger.info('[Call OpenAI] Received callOpenAi event', input)

  const result = await openai.chat.completions.create({
    messages: [{ role: 'system', content: input.message }],
    model: 'gpt-4o-mini',
    stream: true,
  })

  const messages: string[] = []

  for await (const chunk of result) {
    messages.push(chunk.choices[0].delta.content ?? '')

    /**
     * Now we're populating a previously created message with the streamed data from OpenAI
     */
    await context.streams.openai.update(traceId, { message: messages.join('') })
  }

  logger.info('[Call OpenAI] OpenAI response', result)
}
