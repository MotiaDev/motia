import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'OpenAiApi',
  description: 'Call OpenAI',
  path: '/open-ai',
  method: 'POST',
  emits: ['openai-prompt'],
  flows: ['open-ai'],
  bodySchema: z.object({ message: z.string({ description: 'The message to send to OpenAI' }) }),
  responseSchema: {
    200: z.object({ message: z.string({ description: 'The message from OpenAI' }) }),
  },
}

export const handler: Handlers['OpenAiApi'] = async (req, { traceId, logger, emit, streams }) => {
  logger.info('[Call OpenAI] Received callOpenAi event', { message: req.body.message })

  /**
   * This creates a record with empty message string to be populated in the next step
   */
  const result = await streams.openai.create(traceId, { message: '' })

  await emit({
    topic: 'openai-prompt',
    data: { message: req.body.message },
  })

  return { status: 200, body: result }
}
