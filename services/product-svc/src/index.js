const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors'); // Thêm cors

const { initDB } = require('./models'); 
const productRoutes = require('./routes/productRoutes');
// Import consumer vừa tạo
const consumeOrderCreated = require('./consumers/InventoryConsumer');

const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes); 
app.use('/', productRoutes);

const startServer = async () => {
    try {
        // 1. Kết nối DB
        await initDB();

        // 2. Kết nối RabbitMQ (Bọc try-catch để không sập app nếu chưa cài RabbitMQ)
        try {
            if (process.env.RABBITMQ_URL) {
                await consumeOrderCreated();
            } else {
                console.log("⚠️ RABBITMQ_URL not found in .env, skipping consumer.");
            }
        } catch (mqError) {
            console.error('⚠️ RabbitMQ connection failed:', mqError.message);
        }

        // 3. Start Server
        app.listen(PORT, () => {
            console.log(`🚀 Product Service running on port ${PORT}`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
    }
};

startServer();