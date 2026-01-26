const { DataTypes } = require('sequelize');
const db = require('../config/db'); // Import instance vừa export ở trên

// db lúc này chính là sequelize instance, nên db.define sẽ hoạt động
const ProductUom = db.define('ProductUom', {
    // ... nội dung model
    exchange_rate: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    // ...
}, {
    tableName: 'product_uoms',
    timestamps: false
});

module.exports = ProductUom;