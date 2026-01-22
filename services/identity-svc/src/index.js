import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import { initTables } from './models/index.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Khởi tạo database
initTables();

// Routes
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Identity Service is running on port ${PORT}`);
});