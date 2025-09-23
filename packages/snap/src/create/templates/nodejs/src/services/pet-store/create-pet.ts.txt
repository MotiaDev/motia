import { Pet } from './types'

export const createPet = async (pet: Omit<Pet, 'id'>): Promise<Pet> => {
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
}