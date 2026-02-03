import { z } from 'zod'
import type { EventConfig, Handlers } from '../../../types'
import { message, value } from '../file'

export const config: EventConfig = {
  type: 'event',
  name: 'StepWithDirectFile',
  subscribes: ['test.event'],
  emits: [],
  input: z.object({}),
  flows: ['TestFlow'],
}

export const handler: Handlers['StepWithDirectFile'] = async (input, { logger }) => {
  logger.info('Value:', value)
  logger.info('Message:', message)
}
