import { getChannel } from '../config/rabbitmq.js';
import db from '../config/db.js';

const EXCHANGE_NAME = 'bizflow_event_bus';
const QUEUE_NAME = 'product_stock_updates'; // Đặt tên queue rõ ràng
const ROUTING_KEY = 'order.created';

export const startOrderCreatedConsumer = async () => {
    const channel = getChannel();
    if (!channel) {
        console.error("❌ RabbitMQ channel chưa sẵn sàng.");
        return;
    }

    try {
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

        console.log(`🎧 Product Service đang lắng nghe: '${ROUTING_KEY}'...`);

        channel.consume(QUEUE_NAME, async (msg) => {
            if (!msg) return;

            const content = JSON.parse(msg.content.toString());
            const { payload } = content;

            console.log(`📦 Nhận yêu cầu trừ kho đơn hàng: ${payload.order_id}`);

            try {
                await updateProductStock(payload.items);
                channel.ack(msg);
            } catch (error) {
                console.error("❌ Lỗi trừ kho:", error);
                // Nếu lỗi database (ví dụ mất kết nối), có thể dùng nack để thử lại sau
                // channel.nack(msg, false, false);
            }
        });
    } catch (error) {
        console.error("❌ Lỗi khởi tạo Consumer:", error);
    }
};

const updateProductStock = async (items) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        for (const item of items) {
            // item gồm: { product_id, quantity, unit, ... }
            const { product_id, quantity, unit } = item;
            let qtyToDeduct = Number(quantity);
            const sellUnit = unit ? unit.toLowerCase().trim() : '';

            // 1. Lấy thông tin Unit hiện tại của sản phẩm trong DB
            const productRes = await client.query(
                `SELECT unit FROM product WHERE id = $1`, 
                [product_id]
            );

            if (productRes.rows.length > 0) {
                const baseUnit = productRes.rows[0].unit ? productRes.rows[0].unit.toLowerCase().trim() : '';

                // 2. Logic quy đổi đơn vị (Nếu đơn vị bán khác đơn vị gốc)
                if (sellUnit && baseUnit && sellUnit !== baseUnit) {
                    // Tìm hệ số quy đổi trong bảng product_uom
                    const conversionRes = await client.query(`
                        SELECT pu.conversion_factor 
                        FROM product_uom pu
                        JOIN uom u ON pu.uom_id = u.id
                        WHERE pu.product_id = $1 AND LOWER(u.uom_name) = $2
                    `, [product_id, sellUnit]);

                    if (conversionRes.rows.length > 0) {
                        const factor = Number(conversionRes.rows[0].conversion_factor);
                        qtyToDeduct = qtyToDeduct * factor;
                        console.log(`🔄 Quy đổi: 1 ${sellUnit} = ${factor} ${baseUnit} -> Trừ tổng: ${qtyToDeduct}`);
                    }
                }
            }

            // 3. Cập nhật trực tiếp vào bảng PRODUCT
            await client.query(`
                UPDATE product 
                SET stock = stock - $1, 
                    updated_at = NOW()
                WHERE id = $2
            `, [qtyToDeduct, product_id]);
        }

        await client.query('COMMIT');
        console.log("✅ Đã cập nhật tồn kho thành công.");
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};