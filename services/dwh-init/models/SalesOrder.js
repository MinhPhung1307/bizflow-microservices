// Lưu trữ thông tin chung về một đơn hàng bán.

import database from '../database/db.js';

export const createSalesOrderTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS sales_order (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID NOT NULL,
                customer_id UUID, -- NULL nếu là khách vãng lai
                customer_name VARCHAR(150),
                order_type VARCHAR(50) NOT NULL, -- AT_COUNTER, PHONE_ZALO
                status VARCHAR(50) NOT NULL, -- PENDING, COMPLETED, CANCELED
                total_price DECIMAL(19, 2) NOT NULL CHECK (total_price >= 0),
                tax_price DECIMAL(19, 2) NOT NULL CHECK (tax_price >= 0),
                payment_method VARCHAR(50) NOT NULL, -- CASH, TRANSFER, DEBT
                paid_at TIMESTAMP CHECK (paid_at IS NULL OR paid_at <= CURRENT_TIMESTAMP),
                is_debt BOOLEAN NOT NULL,
                created_by_user_id UUID NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            ALTER TABLE debt_transaction
            ADD FOREIGN KEY (order_id) REFERENCES sales_order(id);
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating SalesOrder table:', error); 
        process.exit(1);
    }
}