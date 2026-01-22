// Bảng này dùng để lưu lịch sử duyệt, lý do từ chối tài khoản của Admin
import database from '../database/db.js';

export const createUserApprovalTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS user_approvals (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID NOT NULL,
                admin_id UUID,         -- Admin thực hiện thao tác
                action user_status,    -- Trạng thái được chuyển tới (ACTIVE/REJECTED...)
                reason TEXT,           -- Lý do (đặc biệt quan trọng khi REJECTED)
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating User Approvals table:', error);
    }
}