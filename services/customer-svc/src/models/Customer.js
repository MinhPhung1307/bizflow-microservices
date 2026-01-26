// Lưu thông tin khách hàng của hộ kinh doanh.

import database from '../database/db.js';

export const createCustomerTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS customer (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID NOT NULL, -- Link tới chủ cửa hàng (Identity SVC)
                full_name VARCHAR(150) NOT NULL,
                phone_number VARCHAR(20),
                address TEXT,
                total_outstanding_debt DECIMAL(19, 2) DEFAULT 0 CHECK (total_outstanding_debt >= 0),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS debt_transaction (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                customer_id UUID NOT NULL,
                order_id UUID, -- Lưu ID đơn hàng (tham chiếu mềm sang Order SVC)
                amount DECIMAL(19, 2) NOT NULL,
                type VARCHAR(20) NOT NULL, -- 'credit' (ghi nợ), 'debit' (trả nợ)
                description TEXT,
                transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating User table:', error); 
        process.exit(1);
    }
}