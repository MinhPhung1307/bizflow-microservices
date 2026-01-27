const sequelize = require('../config/db');
const Product = require('./Product');
const Inventory = require('./Inventory');
const Uom = require('./Uom');
const ProductUom = require('./ProductUom');
const Category = require('./Category');
const StockImport = require('./StockImport');

// --- ĐỊNH NGHĨA QUAN HỆ (ASSOCIATIONS) ---

// 1. Category - Product
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

// 2. Product - Inventory
Product.hasOne(Inventory, { foreignKey: 'product_id' });
Inventory.belongsTo(Product, { foreignKey: 'product_id' });

// 3. Product - Uom
Product.belongsToMany(Uom, { through: ProductUom, foreignKey: 'product_id' });
Uom.belongsToMany(Product, { through: ProductUom, foreignKey: 'uom_id' });

// Quan hệ trực tiếp với bảng trung gian (ProductUom)
Product.hasMany(ProductUom, { foreignKey: 'product_id' });
ProductUom.belongsTo(Product, { foreignKey: 'product_id' });

Uom.hasMany(ProductUom, { foreignKey: 'uom_id' });
ProductUom.belongsTo(Uom, { foreignKey: 'uom_id' });


// 5. Product - StockImport
Product.hasMany(StockImport, { foreignKey: 'product_id' });
StockImport.belongsTo(Product, { foreignKey: 'product_id' });

// --- HÀM KHỞI TẠO DATABASE ---
const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established.');
        
        // Sử dụng alter: true để cập nhật bảng nếu có thay đổi
        await sequelize.sync({ alter: true }); 
        console.log('✅ Database synchronized.');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
};

module.exports = {
    sequelize,
    initDB,
    Product,
    Inventory,
    Uom,
    ProductUom,
    Category,
    StockImport
};