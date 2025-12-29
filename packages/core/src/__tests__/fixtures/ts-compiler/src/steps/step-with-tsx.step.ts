import { z } from 'zod'
import type { EventConfig, Handlers } from '../../../types'
import { data } from '../lib-tsx'

export const config: EventConfig = {
  type: 'event',
  name: 'StepWithTsx',
  subscribes: ['test.event'],
  emits: [],
  input: z.object({}),
  flows: ['TestFlow'],
}

export const handler: Handlers['StepWithTsx'] = async (input, { logger }) => {
  const result = await data.query()
  logger.info('Query result:', result)
}
