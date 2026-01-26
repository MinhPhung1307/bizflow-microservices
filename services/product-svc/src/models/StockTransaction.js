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
    quantity_change: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Số dương là nhập, số âm là xuất'
    },
    transaction_type: {
        type: DataTypes.ENUM('IMPORT', 'SALE', 'RETURN', 'ADJUSTMENT'),
        allowNull: false
    },
    reference_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Mã đơn hàng hoặc mã phiếu nhập'
    },
    performed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID nhân viên thực hiện'
    },
    note: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'stock_transactions',
    timestamps: true
});

module.exports = StockTransaction;