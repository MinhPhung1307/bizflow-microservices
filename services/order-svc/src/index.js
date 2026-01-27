import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectRabbitMQ } from './config/rabbitmq.js';
import orderRoutes from './routes/orderRoutes.js'; 

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Log request để debug (Giữ lại để theo dõi)
app.use((req, res, next) => {
    console.log(`[DEBUG] Request received: ${req.method} ${req.originalUrl}`);
    next();
});

const PORT = process.env.PORT || 4003; 

const startServer = async () => {
    try {
        await connectRabbitMQ();

        // Đăng ký route cho cả 2 trường hợp để chắc chắn bắt được request
        app.use('/api/orders', orderRoutes); // Trường hợp Kong KHÔNG cắt path
        app.use('/', orderRoutes);           // Trường hợp gọi nội bộ hoặc Kong CÓ cắt path
        // -----------------

        app.listen(PORT, () => {
            console.log(`🚀 Order Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();