const { DataTypes } = require('sequelize');
const db = require('../config/db');

const StockTransaction = db.define('StockTransaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    transaction_type: {
        type: DataTypes.ENUM('IN', 'OUT'), // Nhập kho hoặc Xuất kho
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reason: { // Ví dụ: "Đơn hàng #123", "Nhập hàng mới"
        type: DataTypes.STRING,
        allowNull: true
    },
    reference_id: { // Lưu ID đơn hàng hoặc ID phiếu nhập
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'stock_transactions',
    timestamps: true
});

module.exports = StockTransaction;