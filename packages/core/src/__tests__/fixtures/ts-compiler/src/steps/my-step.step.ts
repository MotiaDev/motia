import { z } from 'zod'
import type { EventConfig, Handlers } from '../../../types'
import { data, items } from '../lib'

export const config: EventConfig = {
  type: 'event',
  name: 'MyStep',
  subscribes: ['my.event'],
  emits: [],
  input: z.object({
    itemId: z.number(),
  }),
  flows: ['MyFlow'],
}

export const handler: Handlers['MyStep'] = async (input, { logger }) => {
  const result = await data
    .select()
    .from(items)
    .where(() => true)
  logger.info('Found items', result)
}
