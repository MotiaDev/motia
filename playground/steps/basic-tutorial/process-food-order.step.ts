import { api, event, step } from '@iii-dev/motia'
import { z } from 'zod'
import { petStoreService } from './services/pet-store'

const orderSchema = z.object({
  email: z.string(),
  quantity: z.number(),
  petId: z.string(),
})

export const stepConfig = {
  name: 'ProcessFoodOrder',
  description: 'basic-tutorial event step, demonstrates how to consume an event from a topic and persist data in state',
  flows: ['basic-tutorial'],
  triggers: [
    event('process-food-order', {
      input: orderSchema,
    }),
    api('POST', '/process-food-order', {
      bodySchema: orderSchema,
    }),
  ],
  emits: ['notification'],
}

export const { config, handler } = step(stepConfig, async (input, ctx) => {
  const data = ctx.getData() // this will return the data regardless of the trigger type

  ctx.logger.info('Step 02 - Process food order', {
    input: data,
    traceId: ctx.traceId,
    triggerType: ctx.trigger.type,
  })

  const order = await petStoreService.createOrder({
    ...data,
    shipDate: new Date().toISOString(),
    status: 'placed',
  })

  ctx.logger.info('Order created', { order })

  await ctx.state.set('orders', order.id, order)

  await ctx.emit({
    topic: 'notification',
    data: {
      email: data.email,
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

  return ctx.match({
    api: async () => {
      return {
        status: 200,
        body: {
          success: true,
          order,
        },
      }
    },
  })
})
