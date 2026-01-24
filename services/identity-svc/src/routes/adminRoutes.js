import express from 'express';
import * as AdminController from '../controllers/AdminController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken, isAdmin);

router.get('/owners', AdminController.getAllOwners);

export default router;