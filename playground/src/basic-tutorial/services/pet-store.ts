import type { Order, Pet } from './types'

const API_URL = process.env.API_URL || 'https://xnigaj-xtnawg.motiahub.com'

export const petStoreService = {
  createPet: async (pet: Omit<Pet, 'id'>): Promise<Pet> => {
    const response = await fetch(`${API_URL}/pet`, {
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
  createOrder: async (order: Omit<Order, 'id' | 'complete'>): Promise<Order> => {
    const response = await fetch(`${API_URL}/store/order`, {
      method: 'POST',
      body: JSON.stringify({
        quantity: order?.quantity ?? 1,
        petId: order?.petId ?? '1',
        shipDate: order?.shipDate ?? new Date().toISOString(),
        status: order?.status ?? 'placed',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    return response.json()
  },
}
