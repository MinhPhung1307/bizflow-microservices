const { DataTypes } = require('sequelize');
const db = require('../config/db');

const ProductUom = db.define('ProductUom', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'product',
            key: 'id'
        }
    },
    uom_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'uom',
            key: 'id'
        }
    },
    conversion_factor: {
        type: DataTypes.DECIMAL(10, 3),
        defaultValue: 1
    },
    is_base_unit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    selling_price: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    }
}, {
    tableName: 'product_uom',   // Tên bảng số ít
    freezeTableName: true,
    timestamps: true,
    underscored: true,
});

module.exports = ProductUom;