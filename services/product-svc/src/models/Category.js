const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Category = db.define('Category', {
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
        type: DataTypes.STRING,
        allowNull: true
    },
    owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID của chủ cửa hàng (Multi-tenant)'
    }
}, {
    tableName: 'categories',
    timestamps: true
});

module.exports = Category;