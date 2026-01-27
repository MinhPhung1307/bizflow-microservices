import express from 'express';
import dotenv from 'dotenv';
import db from './config/db.js'; 
import { createCustomerTable } from './models/Customer.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
// 1. Import Routes (Thêm dòng này)
import customerRoutes from './routes/customerRoutes.js'; 

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4005; 

const startServer = async () => {
    try {
        await createCustomerTable();
        await connectRabbitMQ();

        app.use('/', customerRoutes); 

        app.listen(PORT, () => {
            console.log(`🚀 Customer Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();