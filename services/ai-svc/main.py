import os
import json
import uvicorn
import requests
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from dotenv import load_dotenv

# 1. Cấu hình & Load Env
load_dotenv()
# Cắt bỏ khoảng trắng và ký tự lạ (quan trọng)
API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()

# Danh sách model sẽ thử lần lượt (Ưu tiên Flash -> Pro 1.5 -> Pro 1.0)
MODELS_TO_TRY = ["gemini-2.5-flash" ,"gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"]

app = FastAPI(title="BizFlow AI Service (Standalone)")

# --- HÀM DEBUG: KIỂM TRA MODEL KHẢ DỤNG ---
def check_available_models():
    if not API_KEY:
        print("❌ [Startup] Missing GOOGLE_API_KEY")
        return

    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            models = response.json().get('models', [])
            names = [m['name'].replace('models/', '') for m in models if 'generateContent' in m['supportedGenerationMethods']]
            print("\n✅ [Startup] Các model khả dụng cho Key của bạn:")
            print(f"   {', '.join(names)}\n")
        else:
            print(f"⚠️ [Startup] Không thể lấy danh sách model: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ [Startup] Lỗi kết nối kiểm tra model: {e}")

# Chạy kiểm tra ngay khi khởi động file
check_available_models()

# --- DEFINITIONS (MODELS) ---
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

class DraftOrderResponse(BaseModel):
    customer_name: Optional[str] = None
    items: List[dict]
    is_debt: bool = False
    original_message: str

# --- MOCK RAG SERVICE ---
class SimpleRAG:
    def __init__(self):
        self.products = {} 

    def sync_products(self, owner_id, products):
        self.products[owner_id] = products
        print(f"✅ Synced {len(products)} products for owner {owner_id}")

    def search_products(self, owner_id, query):
        if owner_id not in self.products:
            return []
        return self.products[owner_id]

rag_service = SimpleRAG()

# --- HELPER: CALL GEMINI ---
def call_gemini_api(prompt_text: str, image_data: bytes = None, mime_type: str = None):
    if not API_KEY:
        print("❌ Missing GOOGLE_API_KEY")
        return None

    headers = {"Content-Type": "application/json"}
    parts = [{"text": prompt_text}]
    
    if image_data and mime_type:
        import base64
        b64_data = base64.b64encode(image_data).decode('utf-8')
        parts.append({"inline_data": {"mime_type": mime_type, "data": b64_data}})

    # Thử lần lượt các model trong danh sách
    for model in MODELS_TO_TRY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            params = {"key": API_KEY}
            
            # print(f"Trying model: {model}...") # Uncomment để debug nếu cần
            
            response = requests.post(
                url, 
                params=params, 
                headers=headers, 
                json={"contents": [{"parts": parts}]}, 
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()['candidates'][0]['content']['parts'][0]['text']
            else:
                # Chỉ in lỗi nếu là lỗi 404 (Model not found) hoặc lỗi khác
                print(f"⚠️ Model {model} failed ({response.status_code}): {response.text}")

        except Exception as e:
            print(f"❌ Error with {model}: {e}")
    
    print("❌ Tất cả các model đều thất bại.")
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
    # 1. Lấy context
    products = rag_service.search_products(request.owner_id, request.message)
    product_context = "\n".join([f"- {p['original_name']} (Giá: {p['price']}, Đơn vị: {p['unit']})" for p in products[:50]])
    
    # 2. Prompt
    prompt = f"""
    Bạn là nhân viên bán hàng. Dữ liệu sản phẩm:
    {product_context}
    
    Yêu cầu: "{request.message}"
    
    Trả về JSON duy nhất (không markdown):
    {{
        "customer_name": "Tên khách hoặc null",
        "items": [{{"product_name": "Tên sp khớp nhất", "quantity": số lượng, "unit": "đơn vị"}}],
        "is_debt": true/false
    }}
    """

    # 3. Gọi AI
    ai_text = call_gemini_api(prompt)
    if not ai_text:
        return DraftOrderResponse(items=[], is_debt=False, original_message=request.message + " (Lỗi kết nối AI)")

    # 4. Parse JSON
    try:
        json_str = ai_text.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        data = json.loads(json_str)
        data['original_message'] = request.message
        return DraftOrderResponse(**data)
    except Exception as e:
        print(f"❌ Parse JSON Error: {e}")
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