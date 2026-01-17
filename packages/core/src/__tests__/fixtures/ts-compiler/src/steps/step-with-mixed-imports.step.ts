import { z } from 'zod'
import type { EventConfig, Handlers } from '../../../types'
import { value } from '../file'
import { data, items } from '../lib'
import { helper } from '../utils/helpers'

export const config: EventConfig = {
  type: 'event',
  name: 'StepWithMixedImports',
  subscribes: ['test.event'],
  emits: [],
  input: z.object({
    itemId: z.number(),
    text: z.string(),
  }),
  flows: ['TestFlow'],
}

export const handler: Handlers['StepWithMixedImports'] = async (input, { logger }) => {
  const result = await data
    .select()
    .from(items)
    .where(() => true)
  const formatted = helper.format(input.text)
  logger.info('Items:', result)
  logger.info('Value:', value)
  logger.info('Formatted:', formatted)
}
