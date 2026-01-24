// src/routes/reportRoutes.js
import express from 'express';
import ReportController from '../controllers/ReportController.js';
import { verifyToken, isOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả các route dưới đây đều yêu cầu đăng nhập (verifyToken)
router.use(verifyToken);

// Route: Lấy doanh thu ngày (Chỉ Owner mới được xem)
router.get('/daily-revenue', isOwner, ReportController.getDailyRevenue);

// Route: Lấy đơn hàng gần đây (Chỉ Owner mới được xem)
router.get('/recent-orders', isOwner, ReportController.getRecentOrders);

export default router;