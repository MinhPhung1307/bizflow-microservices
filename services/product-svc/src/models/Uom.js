const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Uom = db.define('Uom', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false // Ví dụ: Cái, Hộp, Thùng
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'uoms',
    timestamps: true
});

module.exports = Uom;