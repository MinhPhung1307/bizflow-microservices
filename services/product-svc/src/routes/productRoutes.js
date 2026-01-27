const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Cấu hình upload tạm thời


// 1. Lấy danh sách sản phẩm
router.get('/', ProductController.getAllProducts);

// 2. Tìm kiếm sản phẩm
router.get('/search', ProductController.searchProducts);

// 3. Lấy chi tiết 1 sản phẩm (Lưu ý: Route này nên để sau route /search để tránh trùng)
router.get('/:id', ProductController.getProductById);

// 4. Tạo sản phẩm mới
router.post('/', ProductController.createProduct);

// 5. Cập nhật sản phẩm
router.put('/:id', ProductController.updateProduct);

// 6. Xóa sản phẩm
router.delete('/:id', ProductController.deleteProduct);

// 7. Import sản phẩm từ Excel (Tính năng nâng cao)
router.post('/import', upload.single('file'), ProductController.importProducts);

module.exports = router; 