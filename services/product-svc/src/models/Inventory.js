const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Inventory = db.define('Inventory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    product_id: {
        type: DataTypes.UUID, 
        allowNull: false,
        references: {
            model: 'product', 
            key: 'id'
        }
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    average_cost: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    }
}, {
    tableName: 'inventory',    
    freezeTableName: true,    
    timestamps: true,
    underscored: true,
});

module.exports = Inventory;