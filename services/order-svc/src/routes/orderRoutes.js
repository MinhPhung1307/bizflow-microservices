import express from 'express';
import multer from 'multer';
import { verifyToken } from '../middleware/authMiddleware.js';
import { createOrder, getAllOrders, deleteOrder } from '../controllers/OrderController.js';
import { createDraftOrderFromAI, transcribeAudio } from '../controllers/AIController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Cấu hình thư mục tạm

// AI Routes
router.post('/ai/draft', verifyToken, createDraftOrderFromAI);
router.post('/ai/transcribe', verifyToken, upload.single('audio'), transcribeAudio);

// Order CRUD
router.post('/', verifyToken, createOrder);
router.get('/', verifyToken, getAllOrders);
router.delete('/:id', verifyToken, deleteOrder);

export default router;