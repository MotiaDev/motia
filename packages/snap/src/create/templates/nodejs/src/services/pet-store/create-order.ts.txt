import { Order } from './types'

export const createOrder = async (order: Omit<Order, 'id'>): Promise<Order> => {
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
}