import db from '../config/db.js';
import { publishOrderCreated } from '../config/rabbitmq.js';

export const createOrder = async (req, res) => {
    const client = await db.connect();
    
    try {
        // 1. Lấy dữ liệu từ Request
        const { items, total_amount, customer_id, is_debt, amount_paid, customer_name, payment_method } = req.body;
        
        // Lấy thông tin user từ middleware (đã decode token)
        const userId = req.user?.userId; 
        const ownerId = req.user?.owner_id || req.user?.userId;
        const userName = req.user?.full_name || 'Staff'; // Giả sử middleware có decode name

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Giỏ hàng trống." });
        }

        // Tính toán lại tổng tiền (Lý tưởng là nên gọi Product Service để lấy giá chuẩn, ở đây tạm dùng giá client gửi lên để đơn giản hóa migration)
        let calculatedTotal = 0;
        items.forEach(item => {
            const price = parseFloat(item.price) || 0;
            const qty = parseFloat(item.quantity) || 0;
            calculatedTotal += price * qty;
        });
        const finalTotalPrice = calculatedTotal > 0 ? calculatedTotal : (parseFloat(total_amount) || 0);
        const finalPaymentMethod = is_debt ? 'debt' : (payment_method || 'cash');

        await client.query('BEGIN');

        // 2. Tạo Đơn Hàng (Chỉ thao tác với DB của Order Service)
        const createOrderQuery = `
            INSERT INTO sales_order (
                owner_id, customer_id, customer_name, total_price, status, 
                payment_method, is_debt, created_by_user_id, created_by_name, 
                created_at, order_type, paid_at, tax_price
            ) VALUES (
                $1, $2, $3, $4, 'completed', 
                $5, $6, $7, $8, 
                NOW(), 'counter', 
                CASE WHEN $6::boolean IS TRUE THEN NULL ELSE NOW() END, 
                0
            )
            RETURNING id
        `;

        const orderRes = await client.query(createOrderQuery, [
            ownerId,
            customer_id || null,
            customer_name || 'Khách lẻ',
            finalTotalPrice,
            finalPaymentMethod,
            is_debt || false,
            userId,
            userName
        ]);

        const orderId = orderRes.rows[0].id;

        // 3. Lưu Chi Tiết Đơn Hàng
        for (const item of items) {
            await client.query(
                `INSERT INTO order_item (order_id, product_id, quantity, price, created_at) 
                 VALUES ($1, $2, $3, $4, NOW())`,
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        await client.query('COMMIT');

        // 4. Gửi Event sang RabbitMQ (Async)
        // Product Service nghe để trừ kho. Customer Service nghe để cộng nợ.
        const orderEventData = {
            event: 'ORDER_CREATED',
            payload: {
                order_id: orderId,
                owner_id: ownerId,
                items: items, // Product Service cần cái này
                customer_id: customer_id,
                total_price: finalTotalPrice,
                amount_paid: amount_paid || 0,
                is_debt: is_debt // Customer Service cần cái này
            }
        };

        await publishOrderCreated(orderEventData);

        res.status(201).json({ 
            success: true, 
            message: "Tạo đơn hàng thành công!", 
            orderId 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("🔥 Order Error:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Lỗi Server: " + error.message 
        });
    } finally {
        client.release();
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const ownerId = req.user.owner_id || req.user.userId;

        const query = `
            SELECT id, total_price, customer_name, status, payment_method, 
                   is_debt, order_type, created_at, paid_at, created_by_name
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