const { DataTypes } = require('sequelize');
const db = require('../config/db');

const StockImport = db.define('StockImport', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    import_price: {
        type: DataTypes.DECIMAL(15, 2), // Giá nhập
        allowNull: false,
        defaultValue: 0
    },
    supplier_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    import_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'stock_imports',
    timestamps: true
});

module.exports = StockImport;