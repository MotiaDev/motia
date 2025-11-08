import { createPet } from './create-pet'
import { createOrder } from './create-order'

export * from './types'

export const petStoreService = {
  createPet,
  createOrder,
}
