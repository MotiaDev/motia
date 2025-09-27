import httpx
from typing import Dict, Any
from .types import Order, Pet

class PetStoreService:
    async def create_pet(self, pet: Dict[str, Any]) -> Pet:
        pet_data = {
            "name": pet.get("name", ""),
            "photoUrls": [pet.get("photoUrl", "")],
            "status": "available"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://petstore.swagger.io/v2/pet',
                json=pet_data,
                headers={'Content-Type': 'application/json'}
            )
            return response.json()
    
    async def create_order(self, order: Dict[str, Any]) -> Order:
        async with httpx.AsyncClient() as client:
            order_data = {
                "quantity": order.get("quantity", 1),
                "petId": 1,
                "shipDate": order.get("ship_date", "2025-08-22T22:07:04.730Z"),
                "status": order.get("status", "placed"),
            }
            
            response = await client.post(
                'https://petstore.swagger.io/v2/store/order',
                json=order_data,
                headers={'Content-Type': 'application/json'}
            )
            return response.json()

pet_store_service = PetStoreService()