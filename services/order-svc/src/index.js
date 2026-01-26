import express from 'express';
import orderRoutes from './routes/orderRoutes.js';
import db from './config/db.js';

const app = express();
app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
    console.log(`Order Service is running on port ${PORT}`);
});