export const petStoreService = {
  createPet: async (pet: { name: string; photoUrl: string }) => {
    const response = await fetch('https://petstore.swagger.io/v2/pet', {
      method: 'POST',
      body: JSON.stringify({
        name: pet.name,
        photoUrls: [pet.photoUrl],
        status: 'available',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },
  createOrder: async (order: { id: string; quantity: number; petId: number }) => {
    const response = await fetch('https://petstore.swagger.io/v2/store/order', {
      method: 'POST',
      body: JSON.stringify({
        id: order.id,
        quantity: order.quantity,
        petId: order.petId,
        shipDate: new Date().toISOString(),
        status: 'placed',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  },
}
