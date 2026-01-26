import os
import json
import uvicorn
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File
from dotenv import load_dotenv
from app.models import NaturalLanguageOrderRequest, DraftOrderResponse, ProductSyncRequest
from app.services.rag_service import rag_service
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from google.api_core import exceptions

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

app = FastAPI(title="BizFlow AI Service (Stable)")

# --- CẤU HÌNH MODEL ---
# SỬ DỤNG 1.5 FLASH ĐỂ CÓ QUOTA CAO HƠN, ÍT BỊ LỖI 429
GENERATIVE_MODEL_NAME = "gemini-2.5-flash" 

@app.post("/api/products/sync")
async def sync_products(request: ProductSyncRequest):
    data = [p.dict() for p in request.products]
    rag_service.sync_products(request.owner_id, data)
    return {"status": "success", "count": len(data)}

# --- HÀM GỌI GEMINI CÓ CƠ CHẾ RETRY ---
# Nếu gặp lỗi 429 (ResourceExhausted), tự động đợi và thử lại tối đa 3 lần
@retry(
    retry=retry_if_exception_type(exceptions.ResourceExhausted),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
def generate_content_safe(model, prompt):
    return model.generate_content(prompt)

async def parse_order_with_rag(message: str, owner_id: str) -> DraftOrderResponse:
    try:
        # 1. Tìm kiếm RAG
        relevant_products = rag_service.search_products(owner_id, message)
        
        context_str = ""
        if relevant_products:
            context_str = "DANH SÁCH SẢN PHẨM TRONG KHO (Gợi ý):\n"
            for p in relevant_products:
                context_str += f"- Tên: {p['original_name']} | Giá: {p['price']} | Đơn vị: {p['unit']}\n"
        else:
            context_str = "Không tìm thấy sản phẩm nào trong kho khớp với câu nói."

        # 2. Gọi Gemini
        model = genai.GenerativeModel(GENERATIVE_MODEL_NAME)
        
        prompt = f"""
        Bạn là nhân viên bán hàng. Hãy trích xuất đơn hàng từ câu nói khách hàng thành JSON.
        
        {context_str}
        
        QUY TẮC:
        1. **product_name**: Ưu tiên dùng tên trong danh sách gợi ý nếu khớp.
        2. **quantity**: Số lượng (số thực).
        3. **unit**: Đơn vị tính.
        4. **customer_name**: Tên khách (nếu có).
        5. **is_debt**: True nếu nợ.

        Câu khách nói: "{message}"
        
        Output JSON: {{ "customer_name": null, "items": [{{ "product_name": "...", "quantity": 1, "unit": "..." }}], "is_debt": false, "original_message": "..." }}
        """
        
        # Gọi qua hàm an toàn đã có retry
        response = generate_content_safe(model, prompt)
        
        text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(text)
        data['original_message'] = message
        return DraftOrderResponse(**data)

    except exceptions.ResourceExhausted:
        print("❌ Hết Quota Google (429) - Đã thử lại nhưng vẫn thất bại.")
        return DraftOrderResponse(
            customer_name=None, items=[], is_debt=False, original_message=message + " (Lỗi: Hệ thống quá tải, thử lại sau)"
        )
    except Exception as e:
        print(f"❌ Lỗi Parse: {e}")
        return DraftOrderResponse(
            customer_name=None, items=[], is_debt=False, original_message=message
        )

@app.post("/api/parse-order", response_model=DraftOrderResponse)
async def parse_order(request: NaturalLanguageOrderRequest):
    print(f"📩 Parse Order cho Owner {request.owner_id}: {request.message}")
    result = await parse_order_with_rag(request.message, request.owner_id)
    return result

@app.post("/api/orders/ai/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    try:
        audio_bytes = await audio.read()
        model = genai.GenerativeModel(GENERATIVE_MODEL_NAME)
        
        response = generate_content_safe(model, [
            "Chép lại nội dung đoạn ghi âm này bằng tiếng Việt:",
            {"mime_type": "audio/webm", "data": audio_bytes}
        ])
        
        return {"success": True, "text": response.text.strip()}
    except Exception as e:
        print(f"❌ Lỗi Audio: {e}")
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)