import type { EventConfig, Handlers } from '@iii-dev/motia'
import { z } from 'zod'
import { petStoreService } from './services/pet-store'

export const config = {
  type: 'event',
  name: 'ProcessFoodOrder',
  description: 'basic-tutorial event step, demonstrates how to consume an event from a topic and persist data in state',
  flows: ['basic-tutorial'],
  subscribes: ['process-food-order'],
  emits: ['notification'],
  input: z.object({
    email: z.string(),
    quantity: z.number(),
    petId: z.string(),
  }),
} as const satisfies EventConfig

export const handler: Handlers<typeof config> = async (input, { traceId, logger, state, emit }) => {
  logger.info('Step 02 - Process food order', { input, traceId })

  const order = await petStoreService.createOrder({
    ...input,
    shipDate: new Date().toISOString(),
    status: 'placed',
  })

  logger.info('Order created', { order })

  await state.set('orders', order.id, order)

  await emit({
    topic: 'notification',
    data: {
      email: input.email,
      templateId: 'new-order',
      templateData: {
        status: order.status,
        shipDate: order.shipDate,
        id: order.id,
        petId: order.petId,
        quantity: order.quantity,
      },
    },
  })
}
