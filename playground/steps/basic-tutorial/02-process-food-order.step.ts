import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'
import { petStoreService } from './services/pet-store'

export const config: EventConfig = {
  type: 'event',
  name: 'ProcessFoodOrder',
  description:
    'basic-tutorial event step, this example shows how to consume an event from a topic and persist data in state',
  /**
   * The flows this step belongs to, will be available in Workbench
   */
  flows: ['basic-tutorial'],

  /**
   * This step subscribes to the event `process-food-order` to
   * be processed asynchronously.
   */
  subscribes: ['process-food-order'],

  /**
   * It ultimately emits an event to `new-order-notification` topic.
   */
  emits: ['new-order-notification'],

  /**
   * Definition of the expected input
   */
  input: z.object({ id: z.string(), quantity: z.number(), petId: z.number() }),
}

export const handler: Handlers['ProcessFoodOrder'] = async (input, { traceId, logger, state, emit }) => {
  /**
   * Avoid usage of console.log, use logger instead
   */
  logger.info('Step 02 – Process food order', { input, traceId })

  const order = await petStoreService.createOrder(input)

  /**
   * Persist content on state to be used by other steps
   * or in other workflows later
   */
  await state.set<string>('orders', order.id, order)

  /**
   * Emit events to the topics to process separately
   * on another step
   */
  await emit({
    topic: 'new-order-notification',
    data: { order_id: order.id },
  })
}
