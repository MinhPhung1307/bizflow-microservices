const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Inventory = db.define('Inventory', {
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
    min_stock_level: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'inventories',
    timestamps: true
});

module.exports = Inventory;