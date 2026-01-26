import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import fs from "fs";

// Cấu hình AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const transcribeAudio = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Không có file âm thanh" });

        // Sử dụng OpenAI Whisper (hoặc Gemini nếu muốn)
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(req.file.path),
            model: "whisper-1",
            language: "vi", 
        });

        // Xóa file tạm sau khi xử lý
        fs.unlinkSync(req.file.path);

        res.json({ success: true, text: transcription.text });
    } catch (error) {
        console.error("Transcribe Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createDraftOrderFromAI = async (req, res) => {
    try {
        const { text, context } = req.body; // Context có thể là danh sách sản phẩm gợi ý
        
        // Prompt Engineering (Rút gọn từ bản gốc của bạn)
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `
            Bạn là trợ lý bán hàng. Hãy phân tích đoạn văn bản sau và trích xuất thông tin đơn hàng JSON.
            Văn bản: "${text}"
            Định dạng JSON trả về:
            {
                "items": [{ "product_name": "tên gần đúng", "quantity": 1, "note": "" }],
                "customer_name": "tên khách (nếu có)"
            }
            Chỉ trả về JSON thuần, không markdown.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonText = response.text().replace(/```json|```/g, '').trim();
        
        const draftOrder = JSON.parse(jsonText);

        res.json({ success: true, data: draftOrder });
    } catch (error) {
        console.error("AI Draft Error:", error);
        res.status(500).json({ success: false, message: "Lỗi xử lý AI" });
    }
};