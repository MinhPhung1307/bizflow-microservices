from pydantic import BaseModel
from typing import Optional, List

# --- Định nghĩa các Models dùng chung ---

class OrderItem(BaseModel):
    product_name: str
    quantity: float
    # SỬA Ở ĐÂY: Chuyển từ str thành Optional[str] và mặc định là None
    unit: Optional[str] = None 

class DraftOrderResponse(BaseModel):
    customer_name: Optional[str] = None
    items: List[OrderItem]
    is_debt: bool
    original_message: str

class NaturalLanguageOrderRequest(BaseModel):
    message: str
    owner_id: str 

class ProductSyncItem(BaseModel):
    id: int
    name: str
    price: float
    unit: Optional[str] = ""

class ProductSyncRequest(BaseModel):
    owner_id: str
    products: List[ProductSyncItem]