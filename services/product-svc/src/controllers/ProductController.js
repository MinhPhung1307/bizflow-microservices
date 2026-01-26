const { Product, Category, Inventory, StockTransaction, ProductUom, sequelize } = require('../models');
const { Op } = require('sequelize');

// --- CÁC HÀM CŨ GIỮ NGUYÊN --- (createProduct, getProducts...)

// --- CÁC HÀM CẦN BỔ SUNG ---

// 1. Tìm kiếm sản phẩm (Hỗ trợ tìm theo Tên, Category)
exports.searchProducts = async (req, res) => {
    try {
        const { keyword, category_id, limit } = req.query;
        const whereClause = {};

        // Tìm theo tên (tương đối)
        if (keyword) {
            whereClause.name = { [Op.like]: `%${keyword}%` };
        }

        // Lọc theo danh mục
        if (category_id) {
            whereClause.category_id = category_id;
        }

        const products = await Product.findAll({
            where: whereClause,
            limit: limit ? parseInt(limit) : 20,
            include: [
                { model: Inventory, attributes: ['quantity'] }, // Kèm tồn kho
                { model: Category, attributes: ['name'] },      // Kèm tên danh mục
                { model: ProductUom }                           // Kèm các đơn vị tính
            ]
        });

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Nhập kho (Import Stock)
exports.importStock = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { product_id, quantity, user_id, note } = req.body;

        // Tìm hoặc tạo mới bản ghi tồn kho
        let inventory = await Inventory.findOne({ where: { product_id } });
        
        if (inventory) {
            inventory.quantity += parseInt(quantity);
            await inventory.save({ transaction: t });
        } else {
            await Inventory.create({
                product_id,
                quantity: parseInt(quantity),
                min_stock_level: 10
            }, { transaction: t });
        }

        // Ghi lịch sử nhập kho
        await StockTransaction.create({
            product_id,
            quantity_change: parseInt(quantity), // Số dương
            transaction_type: 'IMPORT',
            performed_by: user_id,
            note: note || 'Nhập hàng thủ công'
        }, { transaction: t });

        await t.commit();
        res.status(200).json({ message: 'Nhập kho thành công' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Lỗi nhập kho', error: error.message });
    }
};