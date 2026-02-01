// Lưu trữ chi tiết các mặt hàng trong đơn hàng.

import database from '../database/db.js';

export const createOrderItemTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS order_item (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_id UUID NOT NULL,
                product_id UUID NOT NULL,
                quantity INT NOT NULL CHECK (quantity > 0),
                price DECIMAL(19, 2) NOT NULL CHECK (price >= 0),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    
                FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating OrderItem table:', error); 
        process.exit(1);
    }
}