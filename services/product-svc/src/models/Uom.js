const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Uom = db.define('Uom', {
    id: {
        type: DataTypes.INTEGER, // Schema là integer
        primaryKey: true,
        autoIncrement: true 
    },
    uom_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    base_unit: {
        type: DataTypes.STRING,
        allowNull: true
    },
    owner_id: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'uom',         // Tên bảng số ít
    freezeTableName: true,
    timestamps: true,
    underscored: true,
});

module.exports = Uom;