import type { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { petStoreService } from '../basic-tutorial/services/pet-store'
import { petSchema } from '../basic-tutorial/services/types'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ArrayStep',
  description: 'Basic API Example step with Array in Body and in Response',
  flows: ['array-step'],

  method: 'POST',
  path: '/array',
  bodySchema: z.array(
    z.object({
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
  ),
  responseSchema: {
    200: z.array(petSchema),
  },
  emits: ['process-food-order'],
}

export const handler: Handlers['ArrayStep'] = async (req, { logger, emit }) => {
  logger.info('Step 01 - Processing API Step', { body: req.body })

  const [{ pet, foodOrder }] = req.body
  const newPetRecord = await petStoreService.createPet(pet)

  logger.info('Pet and food order', { pet, foodOrder })

  if (foodOrder) {
    await emit({
      topic: 'process-food-order',
      data: {
        quantity: foodOrder.quantity,
        email: 'test@test.com', // sample email
        petId: newPetRecord.id,
      },
    })
  }

  return { status: 200, body: [newPetRecord] }
}
