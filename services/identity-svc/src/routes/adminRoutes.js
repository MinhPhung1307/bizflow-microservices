import express from 'express';
import * as AdminController from '../controllers/AdminController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken, isAdmin);

// Routes Quản lý Owner
router.get('/owners', AdminController.getAllOwners);
router.post('/owners', AdminController.createOwner);
router.put('/owners/status', AdminController.toggleOwnerStatus);
router.put('/owners/plan', AdminController.changeOwnerPlan);
router.put('/owners/:id', AdminController.updateOwner);
router.delete('/owners/:id', AdminController.deleteOwner);

// Routes Quản lý Gói dịch vụ
router.get('/plans', AdminController.getSubscriptionPlans); 
router.post('/plans', AdminController.createPlan);
router.put('/plans/:id', AdminController.updatePlan);
router.delete('/plans/:id', AdminController.deletePlan);

export default router;