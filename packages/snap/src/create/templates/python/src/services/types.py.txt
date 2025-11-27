from pydantic import BaseModel
from enum import Enum

class OrderStatus(str, Enum):
    PLACED = "placed"
    APPROVED = "approved"
    DELIVERED = "delivered"

class Pet(BaseModel):
    id: int
    name: str
    photoUrl: str

class Order(BaseModel):
    id: str
    quantity: int
    petId: int
    shipDate: str
    status: OrderStatus
