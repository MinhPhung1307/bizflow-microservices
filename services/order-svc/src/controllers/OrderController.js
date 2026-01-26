import db from '../database/db.js';
import { saveLog } from '../models/AuditLog.js';
import { publishOrderCreated } from '../config/rabbitmq.js';

export const createOrder = async (req, res) => {
    const { items, total_amount, customer_id, is_debt, customer_name, payment_method } = req.body;
    const userId = req.user.userId;
    const ownerId = req.user.owner_id || req.user.userId;

    try {
        // 1. Tạo đơn hàng trong DB của Order Service
        const orderId = await saveOrderToDB({ ...req.body, userId, ownerId });

        // 2. Gửi Event "ORDER_CREATED" sang RabbitMQ
        // Product Service sẽ nghe queue này để tự trừ kho
        publishOrderCreated({
            orderId,
            items: items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            })),
            is_debt,
            customer_id,
            total_amount
        });

        res.status(201).json({ success: true, orderId, message: "Đơn hàng đang được xử lý" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const ownerId = req.user.owner_id || req.user.userId;
        
        // Logic lọc cơ bản
        const query = `
            SELECT 
                id, customer_name, total_price, status, 
                payment_method, is_debt, created_at, created_by_name
            FROM sales_order 
            WHERE owner_id = $1 
            ORDER BY created_at DESC
        `;

        const result = await db.query(query, [ownerId]);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Get Orders Error:", error);
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách đơn hàng" });
    }
};