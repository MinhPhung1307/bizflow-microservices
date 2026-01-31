import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initTables } from './models/index.js';
import productRoutes from './routes/productRoutes.js';
import { connectRabbitMQ } from './config/rabbitmq.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002;

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
  await connectRabbitMQ();
});