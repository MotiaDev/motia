import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: EventConfig = {
  type: 'event',
  name: 'SetStateChange',
  description: 'set a state change for evaluation',

  /**
   * This step subscribes to the event `test-state` to 
   * be processed asynchronously.
   */
  subscribes: ['test-state'],

  /**
   * It ultimately emits an event to `check-state-change` topic.
   */
  emits: ['check-state-change'],

  /**
   * Definition of the expected input
   */
  input: z.object({ message: z.string() }),

  /**
   * The flows this step belongs to, will be available in Workbench
   */
  flows: ['default'],
}

export const handler: Handlers['SetStateChange'] = async (input, { traceId, logger, state, emit }) => {
  /** 
   * Avoid usage of console.log, use logger instead
   */
  logger.info('Step 02 – Pushing message content to state', { input })

  const message = 'Welcome to motia!'

  /**
   * Persist content on state to be used by other steps
   * or in other workflows later
   */
  await state.set<string>(traceId, 'test', message)

  /**
   * Emit events to the topics to process separately
   * on another step
   */
  await emit({
    topic: 'check-state-change',
    data: { key: 'test', expected: message }
  })
}
