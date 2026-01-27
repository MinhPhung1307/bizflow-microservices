const sequelize = require('../config/db');
const Product = require('./Product');
const Inventory = require('./Inventory');
const Uom = require('./Uom');
const ProductUom = require('./ProductUom');
// Import các model mới và model có trong RAR
const Category = require('./Category');
const StockTransaction = require('./StockTransaction');
const StockImport = require('./StockImport'); // Giữ lại cái có trong RAR

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
Product.hasMany(ProductUom, { foreignKey: 'product_id' });
ProductUom.belongsTo(Product, { foreignKey: 'product_id' });

// 4. Product - StockTransaction (Lịch sử kho)
Product.hasMany(StockTransaction, { foreignKey: 'product_id' });
StockTransaction.belongsTo(Product, { foreignKey: 'product_id' });

// 5. Product - StockImport (Giữ lại logic nhập hàng trong RAR)
Product.hasMany(StockImport, { foreignKey: 'product_id' });
StockImport.belongsTo(Product, { foreignKey: 'product_id' });

// --- HÀM KHỞI TẠO DATABASE ---
const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established.');
        
        // alter: true giúp tự động thêm bảng Category, StockTransaction
        await sequelize.sync({ alter: true }); 
        console.log('✅ Database synchronized (Tables created/updated).');
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
    StockTransaction,
    StockImport
};