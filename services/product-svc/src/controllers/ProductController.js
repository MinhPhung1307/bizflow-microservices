import { ProductModel } from '../models/Product.js';

const ProductController = {
  // GET /api/products
  getAllProducts: async (req, res) => {
    try {
      const products = await ProductModel.findAll();
      res.status(200).json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy danh sách sản phẩm' });
    }
  },

  // POST /api/products
  createProduct: async (req, res) => {
    try {
      const { name, sku, base_price } = req.body;
      
      // Validate cơ bản
      if (!name || !sku || !base_price) {
        return res.status(400).json({ message: 'Vui lòng điền tên, SKU và giá cơ bản' });
      }

      // 1. Tạo sản phẩm
      const newProduct = await ProductModel.create(req.body);
      
      // 2. Tự động tạo record tồn kho bằng 0
      await ProductModel.initInventory(newProduct.id);

      res.status(201).json({ 
        message: 'Tạo sản phẩm thành công', 
        product: newProduct 
      });
    } catch (error) {
      console.error('Error creating product:', error);
      // Kiểm tra lỗi trùng SKU hoặc Barcode (Postgres Error Code 23505)
      if (error.code === '23505') {
        return res.status(409).json({ message: 'SKU hoặc Barcode đã tồn tại' });
      }
      res.status(500).json({ message: 'Lỗi server khi tạo sản phẩm' });
    }
  },

  // GET /api/products/:id
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await ProductModel.findById(id);
      if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
};

export default ProductController;