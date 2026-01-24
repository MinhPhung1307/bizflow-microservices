import express from 'express';
import ProductController from '../controllers/ProductController.js';
// Nếu bạn muốn bảo vệ route (chỉ admin được tạo), hãy uncomment dòng dưới
// import { protect } from '../config/authMiddleware.js'; 

const router = express.Router();

router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);

// Thêm middleware protect nếu cần thiết: router.post('/', protect, ProductController.createProduct);
router.post('/', ProductController.createProduct); 

export default router;