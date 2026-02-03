// src/controllers/ReportController.js
import database from '../config/db.js';

class ReportController {
    // Thống kê hệ thống - Admin

    // Biểu đồ doanh thu
    static async getSystemStats(req, res) {
        try {
            // 1. Đếm tổng số Owner
            const ownerCountQuery = `
                SELECT COUNT(*) as total FROM users u
                JOIN role r ON u.role_id = r.id
                WHERE r.role_name = 'OWNER'
            `;
            
            // 2. Đếm Owner đang hoạt động
            const activeOwnerQuery = `
                SELECT COUNT(*) as total FROM users u
                JOIN role r ON u.role_id = r.id
                WHERE r.role_name = 'OWNER' AND u.status = 'ACTIVE'
            `;

            // 3. Đếm số lượng gói dịch vụ
            const planCountQuery = `SELECT COUNT(*) as total FROM subscription_plan`;

            // 4. TÍNH TỔNG DOANH THU: Tổng tiền các đơn hàng đã hoàn thành
            const revenueQuery = `
                SELECT SUM(total_price) as total 
                FROM sales_order 
                WHERE status ILIKE 'completed'
            `;

            const [ownerRes, activeRes, planRes, revenueRes] = await Promise.all([
                database.query(ownerCountQuery),
                database.query(activeOwnerQuery),
                database.query(planCountQuery),
                database.query(revenueQuery)
            ]);

            res.status(200).json({
                totalOwners: parseInt(ownerRes.rows[0].total),
                activeOwners: parseInt(activeRes.rows[0].total),
                totalPlans: parseInt(planRes.rows[0].total),
                totalRevenue: parseFloat(revenueRes.rows[0].total || 0)
            });
        } catch (error) {
            console.error("Stats Error:", error);
            res.status(500).json({ message: "Lỗi khi lấy thống kê hệ thống" });
        }
    };

    // Biểu đồ doanh thu
    static async getRevenueStats(req, res) {
        const { range } = req.query; // '7d', '1m', '1y'
        
        let timeFilter = "NOW() - INTERVAL '7 days'";
        let dateFormat = "DD/MM"; // Ngày/Tháng (cho 7 ngày, 1 tháng)
        
        // Điều chỉnh query dựa trên range
        if (range === '1m') {
            timeFilter = "NOW() - INTERVAL '30 days'";
            dateFormat = "DD/MM";
        } else if (range === '1y') {
            timeFilter = "NOW() - INTERVAL '1 year'";
            dateFormat = "MM/YYYY"; // Tháng/Năm
        }

        try {
            // Tính tổng total_price từ bảng sales_order
            // GROUP BY theo ngày hoặc tháng
            const query = `
                SELECT TO_CHAR(created_at, '${dateFormat}') as date, SUM(total_price) as revenue
                FROM sales_order
                WHERE created_at >= ${timeFilter} AND status = 'completed' -- Chỉ tính đơn hoàn thành
                GROUP BY TO_CHAR(created_at, '${dateFormat}'), DATE_TRUNC('${range === '1y' ? 'month' : 'day'}', created_at)
                ORDER BY DATE_TRUNC('${range === '1y' ? 'month' : 'day'}', created_at) ASC
            `;

            const result = await database.query(query);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error("Revenue Stats Error:", error);
            res.status(500).json([]);
        }
    };

    // Biểu đồ tăng trưởng người dùng
    static async getGrowthStats(req, res) {
        const { range } = req.query; // '7d', '1m', '1y'
        
        let timeFilter = "NOW() - INTERVAL '7 days'";
        let dateFormat = "DD/MM"; // Ngày/Tháng
        let truncType = 'day';    // Gom nhóm theo ngày

        // Cấu hình Query dựa trên range
        if (range === '1m') {
            timeFilter = "NOW() - INTERVAL '30 days'";
            dateFormat = "DD/MM";
            truncType = 'day';
        } else if (range === '1y') {
            timeFilter = "NOW() - INTERVAL '1 year'";
            dateFormat = "MM/YYYY"; // Tháng/Năm
            truncType = 'month';    // Gom nhóm theo tháng
        }

        try {
            const query = `
                SELECT TO_CHAR(created_at, '${dateFormat}') as date, COUNT(*) as count
                FROM users
                WHERE created_at >= ${timeFilter}
                GROUP BY TO_CHAR(created_at, '${dateFormat}'), DATE_TRUNC('${truncType}', created_at)
                ORDER BY DATE_TRUNC('${truncType}', created_at) ASC
            `;
            const result = await database.query(query);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error("Chart Growth Error:", error);
            res.status(500).json([]);
        }
    };

    // Thống kê phương thức thanh toán
    static async getPaymentMethodStats(req, res) {
        try {
            const query = `
                SELECT payment_method, COUNT(*) as count, SUM(total_price) as value
                FROM sales_order
                WHERE status = 'completed'
                GROUP BY payment_method
            `;
            const result = await database.query(query);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error("Payment Stats Error:", error);
            res.status(500).json([]);
        }
    };

    // Top Chủ cửa hàng (Owner) theo doanh thu
    static async getTopOwners(req, res) {
        try {
            const query = `
                SELECT u.full_name, u.phone_number, 
                    COUNT(s.id) as total_orders, 
                    SUM(s.total_price) as total_revenue
                FROM sales_order s
                JOIN users u ON s.owner_id = u.id
                WHERE s.status = 'completed'
                GROUP BY u.id, u.full_name, u.phone_number
                ORDER BY total_revenue DESC
                LIMIT 5
            `;
            const result = await database.query(query);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error("Top Owners Error:", error);
            res.status(500).json([]);
        }
    };

    // Thống kê hệ thống - Owner

    // Lấy doanh thu trong ngày
    static async getDailyRevenue(req, res) {
        try {
            const ownerId = req.user.userId;
            const query = `
                SELECT SUM(total_price) as revenue 
                FROM sales_order 
                WHERE owner_id = $1 
                AND status ILIKE 'completed'
                AND created_at >= CURRENT_DATE
            `;
            const result = await database.query(query, [ownerId]);
            
            // Bạn có thể tính thêm growth bằng cách so sánh với ngày hôm qua nếu muốn
            res.status(200).json({
                success: true,
                data: {
                    revenue: parseFloat(result.rows[0].revenue || 0),
                    growth: 0 // Logic tăng trưởng có thể thêm sau
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Lỗi tính doanh thu" });
        }
    }

    // Báo cáo công nợ
    static async getDebtStats(req, res) {
        try {
            const ownerId = req.user.userId;
            const query = `
                SELECT SUM(total_price) as total_debt, COUNT(DISTINCT customer_id) as count
                FROM sales_order 
                WHERE owner_id = $1 
                AND payment_method ILIKE 'debt%'
                AND status ILIKE 'completed'
            `;
            const result = await database.query(query, [ownerId]);
            res.status(200).json({
                success: true,
                data: {
                    total_debt: parseFloat(result.rows[0].total_debt || 0),
                    count: parseInt(result.rows[0].count || 0)
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Lỗi lấy công nợ" });
        }
    }

    // Cảnh báo tồn kho
    static async getLowStock(req, res) {
        try {
            const ownerId = req.user.userId;
            const threshold = 100; // Ngưỡng cảnh báo
            const query = `
                SELECT id, name, stock, unit 
                FROM product 
                WHERE owner_id = $1 AND stock < $2
                ORDER BY stock ASC
            `;
            const result = await database.query(query, [ownerId, threshold]);
            res.status(200).json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ message: "Lỗi lấy tồn kho" });
        }
    }

    // Biểu đồ doanh thu và chi phí
    static async getRevenueCostStats(req, res) {
        const { range } = req.query; // '7d', '1m', '1y'
        const ownerId = req.user.userId;

        console.log("Received range:", range, "Owner ID:", ownerId);

        // Cấu hình mặc định (7 ngày)
        let timeFilter = "CURRENT_DATE - INTERVAL '6 days'";
        let dateFormat = "DD/MM"; 
        let truncType = 'day';    
        let seriesInterval = '1 day';

        // Điều chỉnh dựa trên range
        if (range === '1m') {
            timeFilter = "CURRENT_DATE - INTERVAL '29 days'";
            dateFormat = "DD/MM";
            truncType = 'day';
            seriesInterval = '1 day';
        } else if (range === '1y') {
            timeFilter = "DATE_TRUNC('year', CURRENT_DATE)";
            dateFormat = "MM/YYYY";
            truncType = 'month';
            seriesInterval = '1 month';
        }

        try {
            const query = `
                WITH date_series AS (
                    SELECT generate_series(${timeFilter}, CURRENT_DATE, '${seriesInterval}')::date AS d
                )
                SELECT 
                    TO_CHAR(ds.d, '${dateFormat}') as name,
                    -- 1. Tính Doanh thu từ sales_order
                    COALESCE((
                        SELECT SUM(total_price) 
                        FROM sales_order 
                        WHERE owner_id = $1 
                        AND status ILIKE 'completed' 
                        AND created_at::date = ds.d
                    ), 0) as revenue,
                    -- 2. Tính Chi phí từ bảng stock_import (theo logic hàm importStock của bạn)
                    COALESCE((
                        SELECT SUM(total_cost) 
                        FROM stock_import 
                        WHERE owner_id = $1 
                        AND created_at::date = ds.d
                    ), 0) as cost
                FROM date_series ds
                ORDER BY ds.d ASC
            `;

            const result = await database.query(query, [ownerId]);
            
            res.status(200).json({
                success: true,
                data: result.rows.map(row => ({
                    name: row.name,
                    revenue: parseFloat(row.revenue),
                    cost: parseFloat(row.cost)
                }))
            });
        } catch (error) {
            console.error("Revenue Cost Chart Error:", error);
            res.status(500).json({ success: false, data: [] });
        }
    }

    // Lấy các hoạt động/đơn hàng gần đây
    static async getRecentActivities(req, res) {
        try {
            const ownerId = req.user.userId;
            const limit = req.query.limit || 5;
            const query = `
                SELECT s.id, u.full_name as customer_name, s.total_price, s.status, s.created_at
                FROM sales_order s
                LEFT JOIN users u ON s.customer_id = u.id
                WHERE s.owner_id = $1
                ORDER BY s.created_at DESC
                LIMIT $2
            `;
            const result = await database.query(query, [ownerId, limit]);
            res.status(200).json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ message: "Lỗi lấy đơn hàng gần đây" });
        }
    }
    
}

export default ReportController;