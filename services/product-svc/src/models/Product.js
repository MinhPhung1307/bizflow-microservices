const { DataTypes } = require('sequelize');
const db = require('../config/db'); // Import kết nối mới

const Product = db.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    owner_id: { // Thêm owner_id để quản lý đa cửa hàng
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'products',
    timestamps: true
});

module.exports = Product;