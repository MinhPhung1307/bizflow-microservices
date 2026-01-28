import database from '../config/db.js';

export const createCustomerTable = async () => {
    try {
        const query = `
            CREATE EXTENSION IF NOT EXISTS "pgcrypto"; 

            CREATE TABLE IF NOT EXISTS customer (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID NOT NULL, 
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
                order_id UUID, 
                amount DECIMAL(19, 2) NOT NULL,
                type VARCHAR(20) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE
            );
        `;
        await database.query(query);
        console.log("✅ Customer Tables created successfully");
    } catch (error) {
        console.error('❌ Error creating Customer tables:', error.message); 
        // process.exit(1) 
    }
}