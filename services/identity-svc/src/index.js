import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import client from 'prom-client'; 
import { initTables } from "./models/index.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";   
import ownerRoutes from "./routes/ownerRoutes.js"; 

import { initLogConsumer } from "./config/rabbitmq.js";

dotenv.config();

const app = express();

// --- CẤU HÌNH PROMETHEUS NÂNG CAO ---
const register = new client.Registry();

// 1. Thu thập các chỉ số mặc định
client.collectDefaultMetrics({
    register,
    prefix: 'identity_svc_', 
});

// 2. Tạo Custom Metric để theo dõi lượt Đăng nhập
// Bạn sẽ gọi loginCounter.inc() trong file controllers/authController.js hoặc middleware
export const loginCounter = new client.Counter({
    name: 'identity_svc_login_total',
    help: 'Tổng số lượt đăng nhập vào hệ thống',
    labelNames: ['status'], // nhãn để phân biệt 'success' hoặc 'fail'
});
register.registerMetric(loginCounter);

// 3. Tạo Custom Metric để theo dõi tổng số Request theo từng Route
const httpRequestCounter = new client.Counter({
    name: 'identity_svc_http_requests_total',
    help: 'Tổng số request HTTP đến Identity Service',
    labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestCounter);

// Middleware để tự động đếm mọi request
app.use((req, res, next) => {
    res.on('finish', () => {
        httpRequestCounter.inc({
            method: req.method,
            route: req.path,
            status_code: res.statusCode
        });
    });
    next();
});

// Endpoint cho Prometheus "cào" dữ liệu
app.get('/metrics', async (req, res) => {
    try {
        res.setHeader('Content-Type', register.contentType);
        res.send(await register.metrics());
    } catch (ex) {
        res.status(500).send(ex);
    }
});
// -----------------------------------------------------------

app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initTables();

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/users", userRoutes);
app.use("/owner", ownerRoutes);

const PORT = process.env.PORT || 4001;

app.listen(PORT, async () => {
    console.log(`Identity Service is running on port ${PORT}`);
    
    initLogConsumer()
        .then(() => console.log("RabbitMQ Log Consumer initialized"))
        .catch(error => console.error("Failed to initialize Log Consumer:", error));
});