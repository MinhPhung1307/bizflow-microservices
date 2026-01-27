import database from '../config/db.js';

export const createSalesOrderTable = async () => {
    try {
        const query = `
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";

            CREATE TABLE IF NOT EXISTS sales_order (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID NOT NULL,
                customer_id UUID,
                customer_name VARCHAR(150),
                order_type VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'completed',
                total_price DECIMAL(19, 2) NOT NULL CHECK (total_price >= 0),
                tax_price DECIMAL(19, 2) DEFAULT 0,
                payment_method VARCHAR(50) NOT NULL,
                paid_at TIMESTAMP,
                is_debt BOOLEAN NOT NULL DEFAULT FALSE,
                created_by_user_id UUID NOT NULL,
                created_by_name VARCHAR(150),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await database.query(query);
        console.log("✅ SalesOrder Table created");
    } catch (error) {
        console.error('❌ Error creating SalesOrder table:', error.message); 
        // process.exit(1); // Tạm comment để debug
    }
}