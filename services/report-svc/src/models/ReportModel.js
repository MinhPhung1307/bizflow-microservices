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
}

export default ReportModel;