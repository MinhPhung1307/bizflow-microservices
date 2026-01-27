import express from 'express';
import * as AdminController from '../controllers/AdminController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Bắt buộc tất cả API Admin phải có Token và quyền Admin
router.use(verifyToken, isAdmin);

// Dashboard Stats APIs
router.get('/stats', AdminController.getDashboardStats);
router.get('/stats/revenue', AdminController.getRevenueStats);
router.get('/stats/growth', AdminController.getGrowthStats);
// ==========================================

// 1. Quản lý Owner
router.get('/owners', AdminController.getAllOwners);
router.post('/owners', AdminController.createOwner);
router.put('/owners/status', AdminController.toggleOwnerStatus);
router.put('/owners/plan', AdminController.changeOwnerPlan);
router.put('/owners/:id', AdminController.updateOwner);
router.delete('/owners/:id', AdminController.deleteOwner);

// 2. Quản lý Gói dịch vụ
router.get('/plans', AdminController.getSubscriptionPlans); 
router.post('/plans', AdminController.createPlan);
router.put('/plans/:id', AdminController.updatePlan);
router.delete('/plans/:id', AdminController.deletePlan);

// 3. Cấu hình hệ thống
router.get('/config', AdminController.getSystemConfig);
router.put('/config', AdminController.updateSystemConfig);

export default router;