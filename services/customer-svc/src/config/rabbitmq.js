import amqp from 'amqplib';
import db from './db.js';

let channel;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
        channel = await connection.createChannel();
        
        // Đảm bảo Queue tồn tại
        await channel.assertQueue('ORDER_CREATED'); 
        
        console.log("Customer Service connected to RabbitMQ");
        consumeOrderEvents();
    } catch (error) {
        console.error("RabbitMQ Connection Error:", error);
        setTimeout(connectRabbitMQ, 5000); // Retry logic
    }
};

const consumeOrderEvents = () => {
    channel.consume('ORDER_CREATED', async (msg) => {
        if (!msg) return;

        const orderData = JSON.parse(msg.content.toString());
        const { customer_id, is_debt, total_amount, amount_paid, orderId } = orderData;

        // Logic: Chỉ xử lý nếu đơn hàng là Nợ và có Customer ID
        if (is_debt && customer_id) {
            try {
                const paid = parseFloat(amount_paid) || 0;
                const total = parseFloat(total_amount) || 0;
                const debtAmount = total - paid;

                if (debtAmount > 0) {
                    // 1. Cập nhật tổng nợ
                    await db.query(
                        `UPDATE customer 
                         SET total_outstanding_debt = total_outstanding_debt + $1 
                         WHERE id = $2`,
                        [debtAmount, customer_id]
                    );

                    // 2. Ghi lịch sử giao dịch nợ
                    await db.query(
                        `INSERT INTO debt_transaction (customer_id, order_id, amount, type, description)
                         VALUES ($1, $2, $3, 'credit', $4)`,
                        [customer_id, orderId, debtAmount, `Ghi nợ từ đơn hàng #${orderId}`]
                    );
                    
                    console.log(`[Debt] Updated debt for customer ${customer_id}: +${debtAmount}`);
                }
            } catch (err) {
                console.error("Error processing debt event:", err);
                // Có thể gửi vào Dead Letter Queue (DLQ) để xử lý lỗi sau
            }
        }

        channel.ack(msg);
    });
};