import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import orderRoutes from './routes/orderRoutes.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import { createSalesOrderTable } from './models/SalesOrder.js';
import { createOrderItemTable } from './models/OrderItem.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Hàm khởi tạo DB và Server
const startServer = async () => {
    try {
        // 1. Init DB Tables (Chờ tạo xong mới đi tiếp)
        await createSalesOrderTable();
        await createOrderItemTable();
        console.log("✅ Order DB Tables initialized");

        // 2. Connect RabbitMQ
        await connectRabbitMQ();

        // 3. Start Server
        const PORT = process.env.PORT || 4003;
        app.listen(PORT, () => {
            console.log(`🚀 Order Service running on port ${PORT}`);
        });

    } catch (error) {
        console.error("❌ Failed to start Order Service:", error);
    }
};

// Routes
app.use('/api/orders', orderRoutes);

// Bắt đầu chạy
startServer();