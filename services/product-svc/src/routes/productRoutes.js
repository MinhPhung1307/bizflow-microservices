import express from 'express';
import * as ProductController from '../controllers/ProductController.js';
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router();

router.use(verifyToken);

router.get('/', ProductController.getAllProducts);

export default router;