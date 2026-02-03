// Lưu trữ các đơn hàng nháp do AI tạo ra từ ngôn ngữ tự nhiên.

import database from '../database/db.js';

export const createFeedbackTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS feedbacks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id), -- Người gửi (Owner)
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PROCESSED
            admin_note TEXT, -- Ghi chú của admin khi xử lý
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating DraftOrder table:', error); 
        process.exit(1);
    }
}