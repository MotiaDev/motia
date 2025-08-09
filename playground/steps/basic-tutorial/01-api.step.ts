import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { petStoreService } from './services/pet-store'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ApiTrigger',
  description:
    'basic-tutorial api trigger, it uses the petstore public api to create a new pet and emits a topic to proces an order if an item is included.',
  /**
   * The flows this step belongs to, will be available in Workbench
   */
  flows: ['basic-tutorial'],

  method: 'POST',
  path: '/basic-tutorial',
  /**
   * Expected request body for type checking and documentation
   */
  bodySchema: z.object({
    pet: z.object({
      name: z.string(),
      photoUrl: z.string(),
    }),
    foodOrder: z
      .object({
        id: z.string(),
        quantity: z.number(),
      })
      .optional(),
  }),

  /**
   * Expected response body for type checking and documentation
   */
  responseSchema: {
    200: z.object({
      message: z.string(),
      traceId: z.string(),
    }),
  },

  /**
   * This API Step emits events to topic `process-food-order`
   */
  emits: ['process-food-order'],

  /**
   * We're using virtual subscribes to virtually connect noop step
   * to this step.
   *
   * Noop step is defined in noop.step.ts
   */
  virtualSubscribes: ['/basic-tutorial'],
}

export const handler: Handlers['ApiTrigger'] = async (req, { logger, emit, traceId }) => {
  /**
   * Avoid usage of console.log, use logger instead
   */
  logger.info('Step 01 – Processing API Step', { body: req.body })

  const { pet, foodOrder } = req.body

  const newPetRecord = await petStoreService.createPet(pet)

  /**
   * Emit events to the topics to process asynchronously
   */
  if (foodOrder) {
    await emit({
      topic: 'process-food-order',
      data: {
        ...foodOrder,
        petId: newPetRecord.id,
      },
    })
  }

  /**
   * Return data back to the client
   */
  return {
    status: 200,
    body: {
      traceId,
      message: 'Your pet has been registered and your order is being processed',
    },
  }
}
