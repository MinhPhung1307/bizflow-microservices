// Lưu trữ các đơn hàng nháp do AI tạo ra từ ngôn ngữ tự nhiên.

import database from '../database/db.js';

export const createDraftOrderTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS draft_order (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID NOT NULL,
                natural_language_input TEXT NOT NULL,
                json_draft_data JSONB NOT NULL, -- Sử dụng JSONB để truy vấn hiệu quả hơn
                status VARCHAR(50) NOT NULL, -- PENDING_CONFIRM, CONFIRMED, REJECTED
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                confirmed_by_user_id UUID,
                
                FOREIGN KEY (owner_id) REFERENCES users(id),
                FOREIGN KEY (confirmed_by_user_id) REFERENCES users(id)
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating DraftOrder table:', error); 
        process.exit(1);
    }
}