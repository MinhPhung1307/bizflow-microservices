const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductController');

// Routes hiện có...
// router.post('/', productController.createProduct);
// router.get('/', productController.getAllProducts);

// --- ROUTE MỚI BỔ SUNG ---
router.get('/search', productController.searchProducts); // API Tìm kiếm
router.post('/import', productController.importStock);   // API Nhập kho

module.exports = router;