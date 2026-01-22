// Lưu trữ tồn kho hiện tại của từng sản phẩm.

import database from '../database/db.js';

export const createInventoryTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS inventory (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID UNIQUE NOT NULL,
                stock INT NOT NULL CHECK (stock >= 0),
                average_cost DECIMAL(15, 2) DEFAULT 0,
                last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating Inventory table:', error); 
        process.exit(1);
    }
}