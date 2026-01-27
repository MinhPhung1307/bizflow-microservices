import chromadb
import google.generativeai as genai
from chromadb import Documents, EmbeddingFunction, Embeddings
import os
from typing import List, Dict

# --- CẤU HÌNH LẠI MODEL EMBEDDING ---
# Lưu ý: Phải dùng dấu gạch ngang (-), không dùng gạch dưới (_)
PRIMARY_EMBEDDING_MODEL = "models/text-embedding-004"
FALLBACK_EMBEDDING_MODEL = "models/embedding-001"

class GeminiEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: Documents) -> Embeddings:
        try:
            # Thử model mới nhất trước
            return self.embed_with_model(PRIMARY_EMBEDDING_MODEL, input)
        except Exception as e:
            print(f"⚠️ Model {PRIMARY_EMBEDDING_MODEL} lỗi, thử fallback sang {FALLBACK_EMBEDDING_MODEL}...")
            try:
                return self.embed_with_model(FALLBACK_EMBEDDING_MODEL, input)
            except Exception as e2:
                print(f"❌ [CRITICAL] Lỗi Embed Gemini: {e2}")
                return []

    def embed_with_model(self, model_name, input):
        response = genai.embed_content(
            model=model_name,
            content=input,
            task_type="retrieval_document"
        )
        return response['embedding']

class RAGService:
    def __init__(self):
        self.client = chromadb.PersistentClient(path="./chroma_db_data")
        self.collection = self.client.get_or_create_collection(
            name="products",
            embedding_function=GeminiEmbeddingFunction()
        )

    def sync_products(self, owner_id: str, products: List[Dict]):
        if not products: return
        
        ids, documents, metadatas = [], [], []
        print(f"🔄 [RAG] Sync {len(products)} SP cho Owner: {owner_id}")

        for p in products:
            p_id = str(p['id'])
            unique_id = f"{owner_id}_{p_id}"
            content = f"{p['name']} {p.get('unit', '')} {p.get('price', '')}"
            
            ids.append(unique_id)
            documents.append(content)
            metadatas.append({
                "owner_id": owner_id,
                "product_id": p_id,
                "original_name": p['name'],
                "unit": p.get('unit', ''),
                "price": str(p.get('price', 0))
            })

        if ids:
            self.collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
            print("✅ [RAG] Sync hoàn tất!")

    def search_products(self, owner_id: str, query_text: str, n_results=5):
        try:
            print(f"🔍 [RAG] Đang tìm: '{query_text}' (Owner: {owner_id})")
            
            # Thử tạo embedding cho query
            try:
                query_embedding = genai.embed_content(
                    model=PRIMARY_EMBEDDING_MODEL,
                    content=query_text,
                    task_type="retrieval_query"
                )
            except:
                # Fallback nếu model chính lỗi
                query_embedding = genai.embed_content(
                    model=FALLBACK_EMBEDDING_MODEL,
                    content=query_text,
                    task_type="retrieval_query"
                )

            results = self.collection.query(
                query_embeddings=[query_embedding['embedding']],
                n_results=n_results,
                where={"owner_id": owner_id}
            )
            
            found_products = []
            if results['metadatas'] and len(results['metadatas']) > 0:
                for idx, meta in enumerate(results['metadatas'][0]):
                    dist = results['distances'][0][idx] if 'distances' in results else 0
                    print(f"   -> Thấy: {meta['original_name']} (Distance: {dist:.4f})")
                    found_products.append(meta)
            
            return found_products

        except Exception as e:
            print(f"❌ [RAG] Lỗi Search: {e}")
            return []

rag_service = RAGService()