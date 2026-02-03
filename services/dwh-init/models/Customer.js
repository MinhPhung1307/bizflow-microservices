// Lưu thông tin khách hàng của hộ kinh doanh.

import database from '../database/db.js';

export const createCustomerTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS customer (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID NOT NULL, -- Hộ kinh doanh sở hữu
                full_name VARCHAR(150) NOT NULL,
                phone_number VARCHAR(20) UNIQUE,
                address VARCHAR(255),
                total_outstanding_debt DECIMAL(19, 2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating User table:', error); 
        process.exit(1);
    }
}