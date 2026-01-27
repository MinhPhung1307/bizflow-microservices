// src/index.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4004;

// Middleware
app.use(cors({
    origin: true, // Cho phép mọi origin (trong dev)
    credentials: true // Cho phép gửi cookie
}));
app.use(express.json());
app.use(cookieParser());

// Health Check route
app.get('/', (req, res) => {
    res.send('Report Service is running...');
});

// Gắn Routes vào path /api/reports
// Khi gọi qua Gateway sẽ là: http://localhost:8000/api/reports/daily-revenue
app.use('/api/reports', reportRoutes);

app.listen(PORT, () => {
    console.log(`Report Service is running on port ${PORT}`);
});