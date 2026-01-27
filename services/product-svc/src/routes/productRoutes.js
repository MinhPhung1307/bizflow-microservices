const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 

// 1. Lấy danh sách sản phẩm
router.get('/', ProductController.getAllProducts);

// 2. Tìm kiếm sản phẩm
router.get('/search', ProductController.searchProducts);

// Route lấy tất cả đơn vị tính
router.get('/uoms/all', ProductController.getAllUoms);

// Route lấy danh sách đơn vị tính của 1 sản phẩm cụ thể
router.get('/:id/uoms', ProductController.getProductUoms);

// Route xử lý /uoms/store (Nếu frontend gọi GET để lấy danh sách của store)
router.get('/uoms/store', ProductController.getAllUoms);

// Route xử lý tạo mới (Nếu frontend gọi POST /uoms/store để tạo)
router.post('/uoms/store', ProductController.createUom);
// -------------------------------------------------------

// 3. Lấy chi tiết 1 sản phẩm
router.get('/:id', ProductController.getProductById);

// 4. Tạo sản phẩm mới
router.post('/', ProductController.createProduct);

// 5. Cập nhật sản phẩm
router.put('/:id', ProductController.updateProduct);

// 6. Xóa sản phẩm
router.delete('/:id', ProductController.deleteProduct);

// 7. Import sản phẩm
router.post('/import', upload.single('file'), ProductController.importProducts);

module.exports = router;