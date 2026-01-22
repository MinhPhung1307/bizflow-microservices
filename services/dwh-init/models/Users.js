// Lưu thông tin tất cả người dùng (Admin, Owner, Employee).

import database from '../database/db.js';

export const createUsersTable = async () => {
    try {
        // status (PENDING, ACTIVE, LOCKED, REJECTED):
        // PENDING: Trạng thái mặc định khi Owner vừa đăng ký xong, chờ Admin xem xét.
        // ACTIVE: Admin đã phê duyệt, tài khoản có thể hoạt động.
        // LOCKED: Tài khoản vi phạm hoặc ngừng sử dụng, Admin có thể khóa lại.
        // REJECTED: Admin từ chối cấp quyền truy cập (kèm lý do).

        // 1. Tạo kiểu ENUM cho trạng thái nếu chưa tồn tại
        const createEnumQuery = `
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
                    CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'LOCKED', 'REJECTED');
                END IF;
            END $$;
        `;
        await database.query(createEnumQuery);

        // 2. Tạo bảng users nếu chưa tồn tại
        const query = `
            CREATE TABLE IF NOT EXISTS users (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL CHECK (char_length(full_name) >= 2),
                shop_name VARCHAR(255) DEFAULT NULL,
                phone_number VARCHAR(20) UNIQUE NOT NULL,
                password TEXT NOT NULL,

                role_id BIGINT NOT NULL,
                owner_id UUID DEFAULT NULL, -- NULL nếu là OWNER/ADMIN, FOREIGN KEY tới users.id 
                avatar JSONB DEFAULT NULL,

                status user_status NOT NULL DEFAULT 'PENDING',

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating Users table:', error); 
    }
}