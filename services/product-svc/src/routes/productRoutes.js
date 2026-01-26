import express from 'express';
import * as ProductController from '../controllers/ProductController.js';
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router();

router.use(verifyToken);

router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);
router.post('/', ProductController.createProduct);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

router.get('/uoms/all', ProductController.getAllUoms);
router.get('/uoms/store', ProductController.getStoreUoms);
router.post('/import', ProductController.importStock);


export default router;