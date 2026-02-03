import express from 'express';
import * as OwnerController from '../controllers/OwnerController.js';
import { verifyToken, isOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken, isOwner);

// Route quản lý Nhân viên
router.get('/employees', OwnerController.getEmployees);
router.post('/employees', OwnerController.createEmployee);
router.put('/employees/:id/toggle-status', OwnerController.toggleStaffStatus);
router.put('/employees/:id/password', OwnerController.changeStaffPassword);
router.delete('/employees/:id', OwnerController.deleteEmployee);

// Route quản lý audit log
router.get('/audit-logs', OwnerController.getAuditLogs);
router.delete('/audit-logs/clear', OwnerController.clearAuditLogs);
router.delete('/audit-logs/:id', OwnerController.deleteAuditLog);

// Route gửi phản hồi
router.post('/feedbacks', OwnerController.sendFeedback);

export default router;