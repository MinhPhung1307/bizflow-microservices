import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import client from 'prom-client'; // 1. Import thư viện prometheus
import { connectRabbitMQ } from './config/rabbitmq.js';
import orderRoutes from './routes/orderRoutes.js'; 

dotenv.config();

const app = express();

// --- 2. CẤU HÌNH PROMETHEUS (Dùng prefix riêng cho Order Service) ---
const register = new client.Registry();
client.collectDefaultMetrics({
    register,
    prefix: 'order_svc_', 
});

// Endpoint để Prometheus truy cập lấy dữ liệu
app.get('/metrics', async (req, res) => {
    try {
        res.setHeader('Content-Type', register.contentType);
        res.send(await register.metrics());
    } catch (ex) {
        res.status(500).send(ex);
    }
});
// ------------------------------------------------------------------

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
    next();
});

const PORT = process.env.PORT || 4003; 

const startServer = async () => {
    try {
        // Khởi chạy RabbitMQ (Sử dụng .catch để không làm treo server)
        await connectRabbitMQ().catch(err => console.error("RabbitMQ Connection Error:", err.message));

        // Đăng ký route
        app.use('/api/orders', orderRoutes); 
        app.use('/', orderRoutes); 

        app.listen(PORT, () => {
            console.log(`🚀 Order Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();