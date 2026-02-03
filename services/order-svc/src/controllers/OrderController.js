import db from '../config/db.js';
import { publishOrderCreated } from '../config/rabbitmq.js';

export const createOrder = async (req, res) => {
    const client = await db.connect();
    
    try {
        // 1. Lấy dữ liệu (Thêm status)
        const { items, total_amount, customer_id, is_debt, amount_paid, customer_name, payment_method, status } = req.body;
        
        const userId = req.user?.userId; 
        const ownerId = req.user?.ownerId || req.user?.userId;
        const userName = req.user?.full_name || 'Staff';

        // Mặc định status là 'completed' nếu không gửi lên
        const orderStatus = status || 'completed';

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Giỏ hàng trống." });
        }

        let calculatedTotal = 0;
        items.forEach(item => {
            const price = parseFloat(item.price) || 0;
            const qty = parseFloat(item.quantity) || 0;
            calculatedTotal += price * qty;
        });
        const finalTotalPrice = calculatedTotal > 0 ? calculatedTotal : (parseFloat(total_amount) || 0);
        const finalPaymentMethod = is_debt ? 'debt' : (payment_method || 'cash');

        await client.query('BEGIN');

        // 2. Tạo Đơn Hàng
        const createOrderQuery = `
            INSERT INTO sales_order (
                owner_id, customer_id, customer_name, total_price, status, 
                payment_method, is_debt, created_by_user_id, created_by_name, 
                created_at, order_type, paid_at, tax_price
            ) VALUES (
                $1, $2, $3, $4, $5, 
                $6, $7, $8, $9, 
                NOW(), 'counter', 
                CASE WHEN $7::boolean IS TRUE THEN NULL ELSE NOW() END, 
                0
            )
            RETURNING id
        `;

        const orderRes = await client.query(createOrderQuery, [
            ownerId,
            customer_id || null,
            customer_name || 'Khách lẻ',
            finalTotalPrice,
            orderStatus, // Sử dụng biến status
            finalPaymentMethod,
            is_debt || false,
            userId,
            userName
        ]);

        const orderId = orderRes.rows[0].id;

        // 3. Lưu Chi Tiết
        for (const item of items) {
            await client.query(
                `INSERT INTO order_item (order_id, product_id, quantity, price, created_at) 
                 VALUES ($1, $2, $3, $4, NOW())`,
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        await client.query('COMMIT');

        // 4. Nếu là đơn NHÁP thì KHÔNG trừ kho/cộng nợ -> Không bắn RabbitMQ
        if (orderStatus === 'completed') {
            const orderEventData = {
                event: 'ORDER_CREATED',
                payload: {
                    order_id: orderId,
                    owner_id: ownerId,
                    items: items,
                    customer_id: customer_id,
                    total_price: finalTotalPrice,
                    amount_paid: amount_paid || 0,
                    is_debt: is_debt
                }
            };
            await publishOrderCreated(orderEventData);
        }

        res.status(201).json({ 
            success: true, 
            message: orderStatus === 'draft' ? "Lưu nháp thành công!" : "Tạo đơn hàng thành công!", 
            orderId 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("🔥 Order Error:", error.message);
        res.status(500).json({ success: false, message: "Lỗi Server: " + error.message });
    } finally {
        client.release();
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const ownerId = req.user.ownerId || req.user.userId;
        const { status } = req.query; // Lấy filter status từ query param

        let query = `
            SELECT id, total_price, customer_name, status, payment_method, 
                   is_debt, order_type, created_at, paid_at, created_by_name
            FROM sales_order
            WHERE owner_id = $1
        `;
        
        const params = [ownerId];

        // Nếu có truyền status (ví dụ: ?status=DRAFT)
        if (status) {
            query += ` AND status = $2`;
            params.push(status);
        }

        query += ` ORDER BY created_at DESC`;

        const result = await db.query(query, params);
        
        // Nếu là lấy DRAFT, ta cần lấy thêm chi tiết items để POS có thể restore lại giỏ hàng
        if (status === 'draft' && result.rows.length > 0) {
            for (let order of result.rows) {
                // Chỉ lấy product_id, quantity, price từ bảng order_item của database này
                const itemsRes = await db.query(
                    `SELECT product_id, quantity, price 
                     FROM order_item 
                     WHERE order_id = $1`, 
                    [order.id]
                );
                order.items = itemsRes.rows;
            }
        }

        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Get Orders Error:", error);
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách đơn hàng" });
    }
};

// --- Xóa đơn hàng (Dùng cho xóa nháp) ---
export const deleteOrder = async (req, res) => {
    const client = await db.connect();
    try {
        const { id } = req.params;
        const ownerId = req.user.ownerId || req.user.userId;

        await client.query('BEGIN');

        // Kiểm tra quyền sở hữu và trạng thái (Chỉ cho xóa DRAFT hoặc PENDING)
        const checkQuery = `SELECT status FROM sales_order WHERE id = $1 AND owner_id = $2`;
        const checkRes = await client.query(checkQuery, [id, ownerId]);

        if (checkRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        }

        // Chỉ cho phép xóa đơn nháp để an toàn
        if (checkRes.rows[0].status !== 'draft') {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: "Chỉ được xóa đơn nháp" });
        }

        // Xóa items trước
        await client.query(`DELETE FROM order_item WHERE order_id = $1`, [id]);
        // Xóa order
        await client.query(`DELETE FROM sales_order WHERE id = $1`, [id]);

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: "Đã xóa đơn hàng" });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Delete Order Error:", error);
        res.status(500).json({ success: false, message: "Lỗi xóa đơn hàng" });
    } finally {
        client.release();
    }
};