// Lưu lịch sử nhập hàng (nhập kho).

import database from '../database/db.js';

export const createStockImportTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS stock_import (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID NOT NULL,
                product_id UUID NOT NULL,
                quantity INT NOT NULL,
                total_cost DECIMAL(19, 2) NOT NULL,
                import_price DECIMAL(15, 2) NOT NULL,
                supplier VARCHAR(255),
                uom_name VARCHAR(50),
                imported_by_user_id UUID NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
                FOREIGN KEY (imported_by_user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating StockImport table:', error); 
        process.exit(1);
    }
}