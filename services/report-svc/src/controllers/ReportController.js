// src/controllers/ReportController.js
import ReportModel from '../models/ReportModel.js';

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

    // Admin Dashboard
    static async getAdminStats(req, res) {
        try {
            const data = await ReportModel.getSystemStats();
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default ReportController;