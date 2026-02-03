import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import client from 'prom-client'; // 1. Import thư viện prometheus
import { initTables } from './models/index.js';
import productRoutes from './routes/productRoutes.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import { startOrderCreatedConsumer } from './consumers/OrderCreatedConsumer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002;

// --- 2. CẤU HÌNH PROMETHEUS (Dùng prefix riêng cho Product Service) ---
const register = new client.Registry();
client.collectDefaultMetrics({
    register,
    prefix: 'product_svc_', 
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
// -------------------------------------------------------------------

// Middleware
app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initTables();

// Routes
app.use('/', productRoutes);

// Health check cho Docker/K8s
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'product-svc' });
});

// Start server
app.listen(PORT, async () => {
  console.log(` Product Service running on port ${PORT}`);
  
  // Khởi chạy RabbitMQ (Sử dụng .then/.catch để không làm treo server)
  connectRabbitMQ()
    .then(async () => {
        console.log("✅ RabbitMQ connected");
        // Kích hoạt lắng nghe sự kiện tạo đơn
        await startOrderCreatedConsumer();
    })
    .catch(err => console.error("❌ RabbitMQ Error:", err.message));
});