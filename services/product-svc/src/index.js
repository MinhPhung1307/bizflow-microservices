import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);

// Health check cho Docker/K8s
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'product-svc' });
});

// Start server
app.listen(PORT, () => {
  console.log(` Product Service running on port ${PORT}`);
});