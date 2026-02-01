// src/controllers/ReportController.js
import ReportModel from '../models/ReportModel.js';
import database from '../config/db.js';

class ReportController {
    
    // --- 1. CÁC HÀM CŨ ---
    static async getDailyRevenue(req, res) {
        try {
            const ownerId = req.user.userId; 
            const data = await ReportModel.getDailyRevenue(ownerId);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }

    static async getRecentOrders(req, res) {
        try {
            const ownerId = req.user.userId;
            const limit = req.query.limit || 5;
            const data = await ReportModel.getRecentOrders(ownerId, limit);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }

    // --- 2. CÁC HÀM MỚI (Bắt buộc phải có để Route mới chạy được) ---

    // Báo cáo công nợ
    static async getDebtReport(req, res) {
        try {
            const ownerId = req.user.userId;
            const data = await ReportModel.getDebtReport(ownerId);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // Cảnh báo tồn kho
    static async getLowStock(req, res) {
        try {
            const ownerId = req.user.userId;
            const data = await ReportModel.getLowStockProducts(ownerId);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // Top sản phẩm bán chạy
    static async getBestSellers(req, res) {
        try {
            const ownerId = req.user.userId;
            const data = await ReportModel.getTopSellingProducts(ownerId);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // Sổ cái kế toán (Thông tư 88)
    static async getAccountingLedger(req, res) {
        try {
            const ownerId = req.user.userId;
            const { month, year } = req.query; 
            
            if (!month || !year) {
                return res.status(400).json({ message: "Vui lòng cung cấp tháng và năm (?month=1&year=2026)" });
            }

            const data = await ReportModel.getAccountingLedger(ownerId, month, year);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // Thống kê hệ thống
    // Admin mới có quyền truy cập
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
}

export default ReportController;