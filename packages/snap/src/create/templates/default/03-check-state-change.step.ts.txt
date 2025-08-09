import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: EventConfig = {
  type: 'event',
  name: 'CheckStateChange',
  description: 'check state change',

  /**
   * This step subscribes to the event `check-state-change` to 
   * be processed asynchronously.
   */
  subscribes: ['check-state-change'],

  /**
   * Doesn't emit anything, which means this is a final step in a workflow
   */
  emits: [],

  /**
   * Definition of the expected input
   */
  input: z.object({ key: z.string(), expected: z.string() }),
  
  /**
   * The flows this step belongs to, will be available in Workbench
   */
  flows: ['default'],
}

export const handler: Handlers['CheckStateChange'] = async (input, { traceId, logger, state }) => {
  /** 
   * Avoid usage of console.log, use logger instead
   */
  logger.info('Step 03 – Executing CheckStateChange step', { input })

  /**
   * Fetches value from state with the given key
   */
  const value = await state.get<string>(traceId, input.key)

  if (value !== input.expected) {
    logger.error('The provided value for the state key does not match', { 
      key: input.key,
      value,
      expected: input.expected
    })
  } else {
    logger.info('The provided value matches the state value 🏁', {
      key: input.key,
      value,
    })
  }
}
