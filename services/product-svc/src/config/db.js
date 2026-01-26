const { Sequelize } = require('sequelize');
require('dotenv').config();

// Khởi tạo kết nối Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432, // Mặc định 5432 cho Postgres
        dialect: process.env.DB_DIALECT || 'postgres', // Quan trọng: phải là postgres hoặc mysql
        logging: false, // Tắt log query cho gọn console
        dialectOptions: process.env.DB_SSL === 'true' ? {
            ssl: {
                require: true,
                rejectUnauthorized: false // Cần thiết cho Neon Tech
            }
        } : {}
    }
);

// Quan trọng: Export trực tiếp biến sequelize instance
module.exports = sequelize;