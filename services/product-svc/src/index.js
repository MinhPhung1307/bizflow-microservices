const express = require('express');
const app = express();
require('dotenv').config();

// QUAN TRỌNG: Phải dùng { } để lấy hàm initDB ra từ object exports
const { initDB } = require('./models'); 
const productRoutes = require('./routes/productRoutes');
const consumeOrderCreated = require('./consumers/InventoryConsumer');

const PORT = process.env.PORT || 4002;

// Middleware xử lý JSON
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);

// Khởi chạy Server
const startServer = async () => {
    try {
        // 1. Kết nối Database trước
        await initDB();

        // 2. Lắng nghe RabbitMQ (Nếu có lỗi kết nối RabbitMQ cũng không làm sập app ngay)
        try {
            //await consumeOrderCreated();
        } catch (mqError) {
            console.error('⚠️ RabbitMQ connection failed (Check if RabbitMQ is running):', mqError.message);
        }

        // 3. Mở cổng Server
        app.listen(PORT, () => {
            console.log(`🚀 Product Service running on port ${PORT}`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();