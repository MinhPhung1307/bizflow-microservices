import database from '../database/db.js';

export const createSalesOrderTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS sales_order (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        owner_id UUID NOT NULL,
                        customer_id UUID,
                        customer_name VARCHAR(150),
                        order_type VARCHAR(50) NOT NULL, 
                        status VARCHAR(50) NOT NULL, 
                        total_price DECIMAL(19, 2) NOT NULL,
                        payment_method VARCHAR(50) NOT NULL, 
                        is_debt BOOLEAN NOT NULL,
                        created_by_user_id UUID NOT NULL,
                        created_by_name VARCHAR(150), -- [NEW] Lưu tên nhân viên tại thời điểm tạo
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        paid_at TIMESTAMP
                    );
                `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating SalesOrder table:', error); 
        process.exit(1);
    }
}