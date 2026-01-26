// src/models/ReportModel.js
import db from '../config/db.js';

class ReportModel {
    /**
     * Lấy tổng doanh thu theo ngày của một Chủ cửa hàng (Owner)
     */
    static async getDailyRevenue(ownerId) {
        const query = `
            SELECT 
                DATE(created_at) as report_date,
                COALESCE(SUM(total_price), 0) as total_revenue,
                COUNT(id) as total_orders
            FROM sales_order
            WHERE owner_id = $1 
              AND DATE(created_at) = CURRENT_DATE
              AND status = 'COMPLETED'
            GROUP BY DATE(created_at);
        `;
        const result = await db.query(query, [ownerId]);
        return result.rows[0] || { report_date: new Date(), total_revenue: 0, total_orders: 0 };
    }

    /**
     * Lấy danh sách đơn hàng gần đây (để test)
     */
    static async getRecentOrders(ownerId, limit = 5) {
        const query = `
            SELECT id, total_price, status, created_at
            FROM sales_order
            WHERE owner_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `;
        const result = await db.query(query, [ownerId, limit]);
        return result.rows;
    }

    static async getDebtReport(ownerId) {
        // Lấy danh sách khách hàng đang nợ tiền
        const query = `
            SELECT 
                full_name,
                phone_number,
                current_debt
            FROM customer
            WHERE owner_id = $1 
              AND current_debt > 0
            ORDER BY current_debt DESC;
        `;
        const result = await db.query(query, [ownerId]);
        return result.rows;
    }

    // --- 3. BỔ SUNG: CẢNH BÁO TỒN KHO (Theo đề bài: Low-stock alerts) ---
    static async getLowStockProducts(ownerId) {
        // Giả sử mức cảnh báo là dưới 10 đơn vị (hoặc cột min_stock_level nếu có)
        const query = `
            SELECT id, product_name, stock_quantity, unit
            FROM product
            WHERE owner_id = $1
              AND stock_quantity <= 10 
            ORDER BY stock_quantity ASC;
        `;
        const result = await db.query(query, [ownerId]);
        return result.rows;
    }

    // --- 4. BỔ SUNG: SẢN PHẨM BÁN CHẠY (Theo đề bài: Best-sellers) ---
    static async getTopSellingProducts(ownerId) {
        const query = `
            SELECT 
                p.product_name,
                SUM(oi.quantity) as total_sold,
                SUM(oi.subtotal) as total_revenue
            FROM order_item oi
            JOIN sales_order so ON oi.order_id = so.id
            JOIN product p ON oi.product_id = p.id
            WHERE so.owner_id = $1 
              AND so.status = 'COMPLETED'
              AND so.created_at >= date_trunc('month', CURRENT_DATE) -- Trong tháng này
            GROUP BY p.product_name
            ORDER BY total_sold DESC
            LIMIT 5;
        `;
        const result = await db.query(query, [ownerId]);
        return result.rows;
    }

    // --- 5. BỔ SUNG: SỔ KẾ TOÁN THÔNG TƯ 88 (Theo đề bài: Circular 88/2021/TT-BTC) ---
    // Mẫu S1-HKD: Sổ chi tiết doanh thu bán hàng hóa, dịch vụ
    static async getAccountingLedger(ownerId, month, year) {
        const query = `
            SELECT 
                created_at as ngay_chung_tu,
                id as so_chung_tu,
                CONCAT('Bán hàng cho ', customer_name) as dien_giai,
                total_price as doanh_thu,
                CASE WHEN payment_method = 'DEBT' THEN total_price ELSE 0 END as ghi_no
            FROM sales_order
            WHERE owner_id = $1 
              AND EXTRACT(MONTH FROM created_at) = $2
              AND EXTRACT(YEAR FROM created_at) = $3
              AND status = 'COMPLETED'
            ORDER BY created_at ASC;
        `;
        const result = await db.query(query, [ownerId, month, year]);
        return result.rows;
    }

    // --- 6. BỔ SUNG: ADMIN DASHBOARD (Theo đề bài: Platform Analytics) ---
    static async getSystemStats() {
        // Đếm tổng Owner và tổng đơn hàng toàn hệ thống
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM users u JOIN role r ON u.role_id = r.id WHERE r.role_name = 'OWNER') as total_owners,
                (SELECT COUNT(*) FROM sales_order) as total_orders
        `;
        const result = await db.query(query);
        return result.rows[0];
    }
}

export default ReportModel;
