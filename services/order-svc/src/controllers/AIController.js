import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const RAW_URL = process.env.AI_SERVICE_URL || 'http://ai-svc:5000';
const AI_SERVICE_URL = RAW_URL.endsWith('/api') ? RAW_URL.slice(0, -4) : RAW_URL;

export const createDraftOrderFromAI = async (req, res) => {
    try {
        const { message } = req.body;
        
        // Kiểm tra User từ Token
        if (!req.user || !req.user.ownerId) {
            return res.status(400).json({ success: false, message: "Lỗi xác thực: Không tìm thấy Owner ID" });
        }

        const payload = {
            message: message,
            owner_id: req.user.ownerId 
        };

        console.log(`🚀 Sending to AI Service: ${AI_SERVICE_URL}/api/parse-order`, payload);

        // Gọi sang AI Service
        const response = await axios.post(`${AI_SERVICE_URL}/api/parse-order`, payload);
        const aiData = response.data;

        // --- SỬA LỖI TẠI ĐÂY: Map dữ liệu để khớp với Frontend ---
        
        // AI trả về 'customer_name' (string), nhưng Frontend cần 'customer' (object)
        const mappedCustomer = aiData.customer_name 
            ? { name: aiData.customer_name } 
            : null;

        const responseData = {
            items: aiData.items || [],
            is_debt: aiData.is_debt || false,
            customer: mappedCustomer
        };

        // Trả về đúng cấu trúc { success: true, data: ... }
        return res.status(200).json({
            success: true,
            data: responseData
        });
        // ---------------------------------------------------------

    } catch (error) {
        console.error("❌ AI Service Error:", error.message);
        if (error.response) {
            console.error("👇 AI Response Data:", JSON.stringify(error.response.data, null, 2));
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({ success: false, message: "Lỗi xử lý AI" });
    }
};

export const transcribeAudio = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No audio file uploaded" });

        // Cần URL riêng cho transcribe vì endpoint khác nhau
        const transcribeUrl = `${AI_SERVICE_URL}/api/orders/ai/transcribe`;

        const formData = new FormData();
        formData.append('audio', fs.createReadStream(req.file.path));

        const response = await axios.post(transcribeUrl, formData, {
            headers: { ...formData.getHeaders() }
        });

        fs.unlinkSync(req.file.path);

        return res.status(200).json(response.data);
    } catch (error) {
        console.error("Transcribe Error:", error.message);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(500).json({ message: "Lỗi dịch giọng nói" });
    }
};