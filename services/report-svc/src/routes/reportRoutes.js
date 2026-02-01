// src/routes/reportRoutes.js
import express from 'express';
import ReportController from '../controllers/ReportController.js';
import { verifyToken, isOwner, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken); // Tất cả đều cần đăng nhập

// --- API CHO CHỦ CỬA HÀNG (OWNER) ---
router.get('/daily-revenue', isOwner, ReportController.getDailyRevenue); // Cũ
router.get('/recent-orders', isOwner, ReportController.getRecentOrders); // Cũ

// Mới bổ sung
router.get('/debt', isOwner, ReportController.getDebtReport);          // Xem ai đang nợ
router.get('/inventory/low-stock', isOwner, ReportController.getLowStock); // Xem hàng sắp hết
router.get('/best-sellers', isOwner, ReportController.getBestSellers); // Xem hàng bán chạy
router.get('/compliance/ledger', isOwner, ReportController.getAccountingLedger); // Sổ sách thuế

// --- API CHO QUẢN TRỊ VIÊN (ADMIN) ---
// Routes Thống kê 
router.get('/admin/stats', isAdmin, ReportController.getSystemStats); 
router.get('/admin/stats/revenue', isAdmin, ReportController.getRevenueStats); // Biểu đồ doanh thu
router.get('/admin/stats/growth', isAdmin, ReportController.getGrowthStats);
router.get('/admin/stats/payment-methods', isAdmin, ReportController.getPaymentMethodStats);
router.get('/admin/stats/top-owners', isAdmin, ReportController.getTopOwners);

export default router;