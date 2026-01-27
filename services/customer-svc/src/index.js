import express from 'express';
import dotenv from 'dotenv';
import db from './config/db.js'; 
import { createCustomerTable } from './models/Customer.js';
import { connectRabbitMQ } from './config/rabbitmq.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5004;

const startServer = async () => {
    try {
        // 1. Init DB Tables
        await createCustomerTable(); // Gọi hàm tạo bảng trực tiếp
        
        // 2. Connect RabbitMQ
        await connectRabbitMQ();

        app.listen(PORT, () => {
            console.log(`🚀 Customer Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();