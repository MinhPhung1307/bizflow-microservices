// Ghi lại các giao dịch liên quan đến công nợ (phát sinh nợ từ đơn hàng và thanh toán nợ).

import database from '../database/db.js';

export const createDebtTransactionTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS debt_transaction (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                customer_id UUID NOT NULL,
                order_id UUID, -- NULL nếu là giao dịch thanh toán nợ không kèm đơn hàng mới
                type VARCHAR(20) NOT NULL, -- DEBT_INC (phát sinh nợ), PAYMENT (thanh toán nợ)
                amount DECIMAL(19, 2) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE,
                FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating User table:', error); 
        process.exit(1);
    }
}