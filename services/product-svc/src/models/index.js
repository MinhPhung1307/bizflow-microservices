// src/models/index.js
const sequelize = require('../config/db');
const Product = require('./Product');
const Inventory = require('./Inventory');
const Uom = require('./Uom');
const ProductUom = require('./ProductUom');
const Category = require('./Category');
const StockTransaction = require('./StockTransaction');

// --- ĐỊNH NGHĨA QUAN HỆ (ASSOCIATIONS) ---

// 1. Category - Product
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

// 2. Product - Inventory
Product.hasOne(Inventory, { foreignKey: 'product_id' });
Inventory.belongsTo(Product, { foreignKey: 'product_id' });

// 3. Product - Uom (Qua bảng trung gian ProductUom)
Product.belongsToMany(Uom, { through: ProductUom, foreignKey: 'product_id' });
Uom.belongsToMany(Product, { through: ProductUom, foreignKey: 'uom_id' });

// Để truy vấn trực tiếp bảng trung gian nếu cần
Product.hasMany(ProductUom, { foreignKey: 'product_id' });
ProductUom.belongsTo(Product, { foreignKey: 'product_id' });

// 4. Product - StockTransaction
Product.hasMany(StockTransaction, { foreignKey: 'product_id' });
StockTransaction.belongsTo(Product, { foreignKey: 'product_id' });

// --- HÀM KHỞI TẠO DATABASE (QUAN TRỌNG) ---
const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established.');
        
        // alter: true giúp tự động tạo bảng hoặc thêm cột thiếu
        await sequelize.sync({ alter: true }); 
        console.log('✅ Database synchronized (Tables created/updated).');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
};

// --- XUẤT RA NGOÀI (BẮT BUỘC PHẢI CÓ initDB) ---
module.exports = {
    sequelize,
    initDB,  // <--- KIỂM TRA KỸ DÒNG NÀY
    Product,
    Inventory,
    Uom,
    ProductUom,
    Category,
    StockTransaction
};