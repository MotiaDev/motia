import type { Handlers, StepConfig } from '@iii-dev/motia'
import { z } from 'zod'

const inputSchema = z.object({
  timestamp: z.string(),
  appName: z.string(),
  greetingPrefix: z.string(),
  requestId: z.string(),
})

export const config = {
  name: 'ProcessGreeting',
  description: 'Processes greeting in the background',
  triggers: [
    {
      type: 'queue',
      topic: 'process-greeting',
      input: inputSchema,
    },
  ],
  enqueues: [],
  flows: ['hello-world-flow'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { logger, state }) => {
  const { timestamp, appName, greetingPrefix, requestId } = input

  logger.info('Processing greeting', { requestId, appName })

  const greeting = `${greetingPrefix} ${appName}!`

  await state.set('greetings', requestId, {
    greeting,
    processedAt: new Date().toISOString(),
    originalTimestamp: timestamp,
  })

  logger.info('Greeting processed successfully', {
    requestId,
    greeting,
    storedInState: true,
  })
}
