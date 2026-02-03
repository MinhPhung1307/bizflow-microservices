// src/routes/reportRoutes.js
import express from 'express';
import ReportController from '../controllers/ReportController.js';
import { verifyToken, isOwner, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken); // Tất cả đều cần đăng nhập

// --- API CHO QUẢN TRỊ VIÊN (ADMIN) ---

// Thống kê hệ thống tổng quát
router.get('/admin/stats', isAdmin, ReportController.getSystemStats); 
// Thống kê doanh thu
router.get('/admin/stats/revenue', isAdmin, ReportController.getRevenueStats); 
// Thống kê tăng trưởng người dùng & cửa hàng
router.get('/admin/stats/growth', isAdmin, ReportController.getGrowthStats);
// Thống kê phương thức thanh toán
router.get('/admin/stats/payment-methods', isAdmin, ReportController.getPaymentMethodStats);
// Thống kê chủ cửa hàng hàng đầu
router.get('/admin/stats/top-owners', isAdmin, ReportController.getTopOwners);

// --- API CHO CHỦ CỬA HÀNG (OWNER) ---

// Doanh thu hôm nay
router.get('/owner/daily-revenue', isOwner, ReportController.getDailyRevenue);   
// Thống kê nợ phải thu
router.get('/owner/debt', isOwner, ReportController.getDebtStats);  
// Báo cáo tồn kho & bán chạy        
router.get('/owner/inventory/low-stock', isOwner, ReportController.getLowStock);
// Biểu đồ doanh thu & chi phí
router.get('/owner/stats/revenue', isOwner, ReportController.getRevenueCostStats); 
// Hoạt động gần đây
router.get('/owner/recent-orders', isOwner, ReportController.getRecentActivities);
export default router;