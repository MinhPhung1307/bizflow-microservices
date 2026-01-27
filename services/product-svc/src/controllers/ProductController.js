const { Product, Inventory, Category, StockImport, StockTransaction, sequelize } = require('../models');
const { Op } = require('sequelize');
const xlsx = require('xlsx');
const fs = require('fs');

// Nếu bạn muốn dùng RabbitMQ để bắn log (Tùy chọn, nếu chưa cấu hình thì có thể comment lại)
// const { getChannel } = require('../config/rabbitmq'); 

const ProductController = {

    // 1. Lấy danh sách sản phẩm (Hỗ trợ phân trang & Owner)
    getAllProducts: async (req, res) => {
        try {
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;
            
            // Giả sử lấy owner_id từ token (nếu có middleware auth), nếu không thì bỏ qua
            const whereClause = {};
            if (req.user && req.user.id) {
                whereClause.owner_id = req.user.id;
            }

            const { count, rows } = await Product.findAndCountAll({
                where: whereClause,
                include: [
                    { model: Category, attributes: ['id', 'name'] },
                    { model: Inventory, attributes: ['quantity'] }
                ],
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']]
            });

            res.json({
                success: true,
                total: count,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                products: rows
            });
        } catch (error) {
            console.error("GetAllProducts Error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 2. Tìm kiếm nâng cao
    searchProducts: async (req, res) => {
        try {
            const { q, category_id, min_price, max_price } = req.query;
            const whereClause = {};

            // Nếu có owner_id từ token
            if (req.user && req.user.id) {
                whereClause.owner_id = req.user.id;
            }

            if (q) {
                whereClause[Op.or] = [
                    { name: { [Op.iLike]: `%${q}%` } }, // iLike cho Postgres (không phân biệt hoa thường)
                    { description: { [Op.iLike]: `%${q}%` } }
                ];
            }

            if (category_id) whereClause.category_id = category_id;

            if (min_price || max_price) {
                whereClause.price = {};
                if (min_price) whereClause.price[Op.gte] = min_price;
                if (max_price) whereClause.price[Op.lte] = max_price;
            }

            const products = await Product.findAll({
                where: whereClause,
                include: [
                    { model: Category, attributes: ['name'] },
                    { model: Inventory, attributes: ['quantity'] }
                ]
            });

            res.json({ success: true, data: products });
        } catch (error) {
            console.error("Search Error:", error);
            res.status(500).json({ success: false, message: 'Lỗi tìm kiếm sản phẩm' });
        }
    },

    // 3. Chi tiết sản phẩm
    getProductById: async (req, res) => {
        try {
            const whereClause = { id: req.params.id };
            if (req.user && req.user.id) {
                whereClause.owner_id = req.user.id;
            }

            const product = await Product.findOne({
                where: whereClause,
                include: [
                    { model: Category },
                    { model: Inventory },
                    // Lấy 5 giao dịch kho gần nhất để xem lịch sử
                    { model: StockTransaction, limit: 5, order: [['createdAt', 'DESC']] }
                ]
            });

            if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
            res.json({ success: true, data: product });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 4. Tạo sản phẩm mới (Có Transaction)
    createProduct: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const { name, price, category_id, description, image_url, initial_stock, code } = req.body;
            // Lấy owner_id từ token hoặc mặc định là 1 (cho test)
            const owner_id = (req.user && req.user.id) ? req.user.id : 1; 

            // Tạo Product
            const newProduct = await Product.create({
                name,
                price,
                category_id,
                description,
                image_url,
                owner_id,
                // code: code // Nếu model Product có trường code thì bỏ comment này ra
            }, { transaction: t });

            // Tạo Inventory (Kho)
            await Inventory.create({
                product_id: newProduct.id,
                quantity: initial_stock || 0
            }, { transaction: t });

            // Nếu có tồn kho ban đầu -> Ghi lịch sử nhập kho
            if (initial_stock > 0) {
                await StockTransaction.create({
                    product_id: newProduct.id,
                    transaction_type: 'IN',
                    quantity: initial_stock,
                    reason: 'Tồn kho ban đầu khi tạo mới'
                }, { transaction: t });
            }

            await t.commit();
            res.status(201).json({ success: true, message: "Tạo sản phẩm thành công", data: newProduct });
        } catch (error) {
            await t.rollback();
            console.error("Create Product Error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 5. Cập nhật sản phẩm
    updateProduct: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const { name, price, category_id, description, image_url, stock } = req.body;
            const productId = req.params.id;
            
            // Check sản phẩm có tồn tại không
            const product = await Product.findByPk(productId);
            if (!product) {
                await t.rollback();
                return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
            }

            // Update thông tin cơ bản
            await product.update({
                name, price, category_id, description, image_url
            }, { transaction: t });

            // Nếu có gửi lên stock -> Update luôn inventory (Đồng bộ)
            if (stock !== undefined && stock !== null) {
                // Tìm inventory
                let inventory = await Inventory.findOne({ where: { product_id: productId } });
                
                if (inventory) {
                    // Tính chênh lệch để ghi log transaction
                    const diff = parseInt(stock) - inventory.quantity;
                    if (diff !== 0) {
                        inventory.quantity = parseInt(stock);
                        await inventory.save({ transaction: t });
                        
                        // Ghi log điều chỉnh kho
                        await StockTransaction.create({
                            product_id: productId,
                            transaction_type: diff > 0 ? 'IN' : 'OUT',
                            quantity: Math.abs(diff),
                            reason: 'Cập nhật thủ công'
                        }, { transaction: t });
                    }
                } else {
                    // Nếu chưa có inventory thì tạo mới
                    await Inventory.create({
                        product_id: productId,
                        quantity: parseInt(stock)
                    }, { transaction: t });
                }
            }

            await t.commit();
            res.json({ success: true, message: 'Cập nhật thành công' });
        } catch (error) {
            await t.rollback();
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 6. Xóa sản phẩm (Xóa sạch dữ liệu liên quan)
    deleteProduct: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const productId = req.params.id;

            // Xóa Inventory trước
            await Inventory.destroy({ where: { product_id: productId }, transaction: t });
            
            // Xóa Lịch sử nhập/xuất kho
            await StockTransaction.destroy({ where: { product_id: productId }, transaction: t });
            
            // Xóa Lịch sử nhập hàng (nếu có model StockImport)
            if (StockImport) {
                await StockImport.destroy({ where: { product_id: productId }, transaction: t });
            }

            // Cuối cùng xóa Product
            const deleted = await Product.destroy({ where: { id: productId }, transaction: t });

            if (!deleted) {
                await t.rollback();
                return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
            }

            await t.commit();
            res.json({ success: true, message: 'Đã xóa sản phẩm và dữ liệu kho liên quan' });
        } catch (error) {
            await t.rollback();
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 7. Import Excel (Tính năng nâng cao)
    importProducts: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng upload file Excel' });

            const workbook = xlsx.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
            
            // Lấy owner_id (mặc định 1 nếu không có auth)
            const owner_id = (req.user && req.user.id) ? req.user.id : 1;
            let importedCount = 0;

            for (const row of data) {
                // Giả định file Excel có cột: Name, Price, Quantity
                // Tạo Product
                const product = await Product.create({
                    name: row.Name || row.name,
                    price: row.Price || row.price || 0,
                    category_id: row.CategoryID || null,
                    owner_id: owner_id
                }, { transaction: t });

                const quantity = parseInt(row.Quantity || row.quantity || 0);

                // Tạo Inventory
                await Inventory.create({
                    product_id: product.id,
                    quantity: quantity
                }, { transaction: t });

                // Lưu vào StockImport (Lịch sử nhập hàng)
                // Model StockImport đã được thêm vào index.js ở các bước trước
                if (StockImport) {
                    await StockImport.create({
                        product_id: product.id,
                        quantity: quantity,
                        import_price: row.ImportPrice || row.Price || 0, // Giá nhập
                        supplier_name: row.Supplier || 'Excel Import'
                    }, { transaction: t });
                }

                // Lưu vào StockTransaction (Biến động kho)
                if (quantity > 0) {
                    await StockTransaction.create({
                        product_id: product.id,
                        transaction_type: 'IN',
                        quantity: quantity,
                        reason: 'Import Excel'
                    }, { transaction: t });
                }

                importedCount++;
            }

            await t.commit();
            
            // Xóa file tạm
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            res.json({ success: true, message: 'Import thành công', totalImported: importedCount });

        } catch (error) {
            await t.rollback();
            // Xóa file tạm nếu lỗi
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            console.error("Import Error:", error);
            res.status(500).json({ success: false, message: 'Lỗi import: ' + error.message });
        }
    }
};

module.exports = ProductController;