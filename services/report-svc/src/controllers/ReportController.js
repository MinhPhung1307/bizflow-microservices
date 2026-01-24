// src/controllers/ReportController.js
import ReportModel from '../models/ReportModel.js';

class ReportController {
    
    // API: Xem doanh thu ngày hôm nay
    static async getDailyRevenue(req, res) {
        try {
            // Lấy userId (chính là ownerId) từ token đã được middleware giải mã
            const ownerId = req.user.userId; 

            const data = await ReportModel.getDailyRevenue(ownerId);

            return res.status(200).json({
                success: true,
                data: data
            });
        } catch (error) {
            console.error('Error fetching daily revenue:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Lỗi server khi lấy báo cáo doanh thu.' 
            });
        }
    }

    // API: Xem các đơn hàng gần đây
    static async getRecentOrders(req, res) {
        try {
            const ownerId = req.user.userId;
            const limit = req.query.limit || 5;

            const orders = await ReportModel.getRecentOrders(ownerId, limit);

            return res.status(200).json({
                success: true,
                data: orders
            });
        } catch (error) {
            console.error('Error fetching recent orders:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Lỗi server khi lấy danh sách đơn hàng.' 
            });
        }
    }
}

export default ReportController;