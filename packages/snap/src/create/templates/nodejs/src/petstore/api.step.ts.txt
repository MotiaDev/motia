import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { petStoreService } from '../services/pet-store'
import { petSchema } from '../services/types'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ApiTrigger',
  description: 'basic-tutorial api trigger',
  flows: ['basic-tutorial'],
  method: 'POST',
  path: '/basic-tutorial',
  bodySchema: z.object({
    pet: z.object({
      name: z.string(),
      photoUrl: z.string(),
    }),
    foodOrder: z
      .object({
        quantity: z.number(),
      })
      .optional(),
  }),
  responseSchema: {
    200: petSchema,
  },
  emits: ['process-food-order'],
}

export const handler: Handlers['ApiTrigger'] = async (req, { logger, traceId, emit }) => {
  logger.info('Step 01 - Processing API Step', { body: req.body })

  const { pet, foodOrder } = req.body
  const newPetRecord = await petStoreService.createPet(pet)

  if (foodOrder) {
    await emit({
      topic: 'process-food-order',
      data: {
        quantity: foodOrder.quantity,
        email: process.env.SAMPLE_EMAIL || 'test@test.com',
        petId: newPetRecord.id,
      },
    })
  }

  return { status: 200, body: { ...newPetRecord, traceId } }
}
