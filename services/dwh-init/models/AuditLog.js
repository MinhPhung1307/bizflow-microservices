// Theo dõi các hành động quan trọng trong hệ thống.

import database from '../database/db.js';

export const createAuditLogTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS audit_log (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID,
                action VARCHAR(100) NOT NULL,
                entity_type VARCHAR(100) NOT NULL, -- (Ví dụ: CREATE_ORDER, UPDATE_PRODUCT_PRICE, DEACTIVATE_ACCOUNT)
                entity_id VARCHAR(50), -- Bảng bị tác động (Ví dụ: sales_order, product)
                old_value JSONB,
                new_value JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating AuditLog table:', error); 
        process.exit(1);
    }
}

export const saveLog = async (client, { user_id, action, entity_type, entity_id, old_value = null, new_value = null }) => {
    const query = `
        INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_value, new_value)
        VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await client.query(query, [
        user_id, 
        action, 
        entity_type, 
        entity_id, 
        old_value ? JSON.stringify(old_value) : null, 
        new_value ? JSON.stringify(new_value) : null
    ]);
};