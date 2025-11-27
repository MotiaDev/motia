import { Order, Pet } from './types'

export const petStoreService = {
  createPet: async (pet: Omit<Pet, 'id'>): Promise<Pet> => {
    const response = await fetch('https://petstore.swagger.io/v2/pet', {
      method: 'POST',
      body: JSON.stringify({
        name: pet?.name ?? '',
        photoUrls: [pet?.photoUrl ?? ''],
        status: 'available',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    return response.json()
  },
  createOrder: async (order: Omit<Order, 'id'>): Promise<Order> => {
    const response = await fetch('https://petstore.swagger.io/v2/store/order', {
      method: 'POST',
      body: JSON.stringify({
        quantity: order?.quantity ?? 1,
        petId: 1,
        shipDate: order?.shipDate ?? new Date().toISOString(),
        status: order?.status ?? 'placed',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    return response.json()
  },
}
