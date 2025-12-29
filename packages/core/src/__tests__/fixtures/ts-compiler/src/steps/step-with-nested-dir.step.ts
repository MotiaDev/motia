import { z } from 'zod'
import type { EventConfig, Handlers } from '../../../types'
import { helper } from '../utils/helpers'

export const config: EventConfig = {
  type: 'event',
  name: 'StepWithNestedDir',
  subscribes: ['test.event'],
  emits: [],
  input: z.object({
    text: z.string(),
  }),
  flows: ['TestFlow'],
}

export const handler: Handlers['StepWithNestedDir'] = async (input, { logger }) => {
  const formatted = helper.format(input.text)
  logger.info('Formatted:', formatted)
}
