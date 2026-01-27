import os
import json
import re
import uvicorn
import requests
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# 1. Cấu hình & Load Env
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
GENERATIVE_MODEL_NAME = "gemini-1.5-flash"

app = FastAPI(title="BizFlow AI Service (Standalone)")

# --- DEFINITIONS (MODELS) ---
# Định nghĩa Model ngay tại đây để tránh lỗi import "ModuleNotFoundError"
class ProductItem(BaseModel):
    id: str
    original_name: str
    price: float
    unit: str

class ProductSyncRequest(BaseModel):
    owner_id: str
    products: List[ProductItem]

class NaturalLanguageOrderRequest(BaseModel):
    owner_id: str
    message: str

class OrderItemResponse(BaseModel):
    product_name: str
    quantity: float
    unit: str

class DraftOrderResponse(BaseModel):
    customer_name: Optional[str] = None
    items: List[OrderItemResponse]
    is_debt: bool = False
    original_message: str

# --- MOCK RAG SERVICE ---
# Tạm thời dùng Mock để service chạy được ngay.
# Sau này bạn có thể tách ra file riêng khi đã quen cấu trúc.
class SimpleRAG:
    def __init__(self):
        self.products = {} # In-memory storage

    def sync_products(self, owner_id, products):
        self.products[owner_id] = products
        print(f"✅ Synced {len(products)} products for owner {owner_id}")

    def search_products(self, owner_id, query):
        # Tìm kiếm đơn giản (Exact match hoặc contains)
        if owner_id not in self.products:
            return []
        # Logic giả lập: Trả về tất cả sản phẩm để Gemini tự lọc (cho demo)
        return self.products[owner_id]

rag_service = SimpleRAG()

# --- HELPER: CALL GEMINI ---
def call_gemini_api(prompt_text: str, image_data: bytes = None, mime_type: str = None):
    if not API_KEY:
        print("❌ Missing GOOGLE_API_KEY")
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GENERATIVE_MODEL_NAME}:generateContent?key={API_KEY}"
    headers = {"Content-Type": "application/json"}
    
    parts = [{"text": prompt_text}]
    if image_data and mime_type:
        import base64
        b64_data = base64.b64encode(image_data).decode('utf-8')
        parts.append({"inline_data": {"mime_type": mime_type, "data": b64_data}})

    try:
        response = requests.post(url, headers=headers, json={"contents": [{"parts": parts}]}, timeout=30)
        response.raise_for_status()
        return response.json()['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        print(f"❌ Gemini API Error: {e}")
        return None

# --- API ENDPOINTS ---

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-svc"}

@app.post("/api/products/sync")
async def sync_products(request: ProductSyncRequest):
    data = [p.dict() for p in request.products]
    rag_service.sync_products(request.owner_id, data)
    return {"status": "success", "count": len(data)}

@app.post("/api/parse-order", response_model=DraftOrderResponse)
async def parse_order(request: NaturalLanguageOrderRequest):
    # 1. Lấy context sản phẩm từ bộ nhớ
    products = rag_service.search_products(request.owner_id, request.message)
    product_context = "\n".join([f"- {p['original_name']} (Giá: {p['price']}, Đơn vị: {p['unit']})" for p in products])
    
    # 2. Tạo Prompt
    prompt = f"""
    Bạn là AI tạo đơn hàng. 
    Dữ liệu sản phẩm có sẵn:
    {product_context}
    
    Yêu cầu của khách: "{request.message}"
    
    Hãy trả về JSON duy nhất (không markdown) theo mẫu:
    {{
        "customer_name": "Tên khách hoặc null",
        "items": [{{"product_name": "Tên sp", "quantity": số lượng, "unit": "đơn vị"}}],
        "is_debt": true/false (nếu khách nói ghi nợ/chưa trả)
    }}
    """

    # 3. Gọi AI
    ai_text = call_gemini_api(prompt)
    if not ai_text:
        return DraftOrderResponse(items=[], is_debt=False, original_message=request.message + " (Lỗi AI)")

    # 4. Parse JSON
    try:
        json_str = ai_text.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        data = json.loads(json_str)
        data['original_message'] = request.message
        return DraftOrderResponse(**data)
    except Exception as e:
        print(f"❌ Parse JSON Error: {e} | Raw: {ai_text}")
        return DraftOrderResponse(items=[], is_debt=False, original_message=request.message)

@app.post("/api/orders/ai/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    try:
        content = await audio.read()
        prompt = "Hãy chép lại chính xác nội dung file ghi âm này ra tiếng Việt."
        text = call_gemini_api(prompt, content, "audio/mp3")
        return {"success": True, "text": text or "Không nhận diện được"}
    except Exception as e:
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)