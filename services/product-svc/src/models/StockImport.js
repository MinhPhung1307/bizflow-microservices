const { DataTypes } = require('sequelize');
const db = require('../config/db');

const StockImport = db.define('StockImport', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    owner_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'product',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    total_cost: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    import_price: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    supplier: {
        type: DataTypes.STRING,
        allowNull: true
    },
    uom_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    imported_by_user_id: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    tableName: 'stock_import',  // Tên bảng số ít
    freezeTableName: true,
    timestamps: true,
    updatedAt: false,           // Schema bạn gửi chỉ có created_at, không có updated_at
    underscored: true,
});

module.exports = StockImport;