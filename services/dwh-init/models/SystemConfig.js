import database from '../database/db.js';

export const createSystemConfigTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS system_config (
                id SERIAL PRIMARY KEY,
                maintenance_mode BOOLEAN DEFAULT FALSE,
                support_email VARCHAR(100) DEFAULT 'support@bizflow.vn',
                ai_model_version VARCHAR(50) DEFAULT 'gpt-4o-mini',
                tax_vat_default DECIMAL(5, 2) DEFAULT 8.00,
                max_upload_size_mb INT DEFAULT 10,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Chèn dòng mặc định nếu bảng chưa có dữ liệu (Chỉ chạy 1 lần)
            INSERT INTO system_config (id, maintenance_mode)
            SELECT 1, FALSE
            WHERE NOT EXISTS (SELECT 1 FROM system_config WHERE id = 1);
        `;
        await database.query(query);
        console.log("System Config table checked/created.");
    } catch (error) {
        console.error('Error creating SystemConfig table:', error);
    }
}