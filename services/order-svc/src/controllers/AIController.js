import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-svc:8000';

export const createDraftOrderFromAI = async (req, res) => {
    try {
        const { text } = req.body;
        // Gọi sang Python Service
        const response = await axios.post(`${AI_SERVICE_URL}/parse-order`, {
            text: text,
            owner_id: req.user.owner_id // Gửi context để RAG tìm đúng sản phẩm
        });
        
        return res.status(200).json(response.data);
    } catch (error) {
        console.error("AI Service Error:", error.message);
        return res.status(500).json({ success: false, message: "Lỗi xử lý AI" });
    }
};

export const transcribeAudio = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No audio file uploaded" });

        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));

        // Gọi sang Python Service endpoint whisper/transcribe
        const response = await axios.post(`${AI_SERVICE_URL}/transcribe`, formData, {
            headers: { ...formData.getHeaders() }
        });

        // Xóa file tạm
        fs.unlinkSync(req.file.path);

        return res.status(200).json(response.data);
    } catch (error) {
        console.error("Transcribe Error:", error);
        return res.status(500).json({ message: "Lỗi dịch giọng nói" });
    }
};