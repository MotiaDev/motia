// This is an example of a TypeScript step.

import type { Handlers } from '@motiadev/core'
import type { EventConfig } from 'motia'
import * as z from 'zod'

export const config: EventConfig = {
  type: 'event',
  name: 'HelloFromTypeScript',
  subscribes: ['hello'],
  input: z.object({ extra: z.string() }),
  emits: ['hello.response.typescript'],

  // Some optional fields. Full list here: https://www.motia.dev/docs/api-reference#eventconfig
  description: 'Says hello in the logs',
  flows: ['hello'],
  virtualEmits: [],
  virtualSubscribes: [],
}

export const handler: Handlers['HelloFromTypeScript'] = async (input, { emit, logger }) => {
  logger.info('Hello from TypeScript!')
}
