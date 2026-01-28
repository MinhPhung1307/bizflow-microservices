const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Product = db.define('Product', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    owner_id: {
        type: DataTypes.UUID, 
        allowNull: false,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING, 
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2), 
        defaultValue: 0
    },
    stock: {
        type: DataTypes.INTEGER, 
        defaultValue: 0
    },
    images: {
        type: DataTypes.JSONB, 
        defaultValue: []
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    unit: {
        type: DataTypes.STRING, 
        allowNull: true
    }
}, {
    tableName: 'product',      
    timestamps: true,          
    underscored: true,        
});

module.exports = Product;