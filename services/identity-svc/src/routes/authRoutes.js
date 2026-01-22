import express from 'express';
import { syncUserWithFirebase, verifyInternalToken } from '../controllers/AuthController.js';

const router = express.Router();

// Route cho Client gọi sau khi Login Firebase
router.post('/sync', syncUserWithFirebase);

// Route nội bộ cho Kong API Gateway hoặc các service khác check quyền
router.get('/introspect', verifyInternalToken);

export default router;