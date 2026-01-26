import express from 'express';
import dotenv from 'dotenv';
import db from './config/db.js';
import { createCustomerTables } from './models/Customer.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
// import customerRoutes from './routes/customerRoutes.js'; // sẽ tạo routes CRUD sau

dotenv.config();

const app = express();
app.use(express.json());

// Routes
// app.use('/api/customers', customerRoutes);

const PORT = process.env.PORT || 5004;

const startServer = async () => {
    // 1. Init DB
    await createCustomerTables(db);
    
    // 2. Connect RabbitMQ (Consumer)
    await connectRabbitMQ();

    app.listen(PORT, () => {
        console.log(`Customer Service running on port ${PORT}`);
    });
};

startServer();