import amqp from 'amqplib';
import db from './db.js';

let channel;

export const connectRabbitMQ = async () => {
    try {
        const amqpServer = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
        const connection = await amqp.connect(amqpServer);
        channel = await connection.createChannel();
        
        // Khai báo Exchange (Giống Order Service)
        const exchangeName = 'bizflow_event_bus';
        await channel.assertExchange(exchangeName, 'topic', { durable: true });

        // Tạo Queue riêng cho Customer Service
        const q = await channel.assertQueue('customer_debt_queue', { durable: true });

        // Bind Queue vào Exchange
        await channel.bindQueue(q.queue, exchangeName, 'order.created');
        
        console.log("Customer Service connected to RabbitMQ");
        consumeOrderEvents(q.queue);
    } catch (error) {
        console.error("RabbitMQ Connection Error:", error);
        setTimeout(connectRabbitMQ, 5000); 
    }
};

const consumeOrderEvents = (queueName) => {
    channel.consume(queueName, async (msg) => {
        if (!msg) return;

        try {
            const data = JSON.parse(msg.content.toString());
            // Cấu trúc message từ Order Service: { event: 'ORDER_CREATED', payload: {...} }
            
            if (data.event === 'ORDER_CREATED') {
                const { customer_id, is_debt, total_price, amount_paid, order_id } = data.payload;

                // Logic: Chỉ xử lý nếu đơn hàng là Nợ và có Customer ID
                if (is_debt && customer_id) {
                    const paid = parseFloat(amount_paid) || 0;
                    const total = parseFloat(total_price) || 0;
                    const debtAmount = total - paid;

                    if (debtAmount > 0) {
                        // 1. Cập nhật tổng nợ
                        await db.query(
                            `UPDATE customer 
                             SET total_outstanding_debt = total_outstanding_debt + $1,
                                 updated_at = NOW()
                             WHERE id = $2`,
                            [debtAmount, customer_id]
                        );

                        // 2. Ghi lịch sử giao dịch nợ
                        // Lưu ý: order_id ở đây là UUID, chỉ lưu text reference hoặc cần đồng bộ type
                        await db.query(
                            `INSERT INTO debt_transaction (
                                customer_id, order_id, amount, type, description
                            ) VALUES ($1, $2, $3, 'credit', $4)`,
                            [
                                customer_id, 
                                order_id, 
                                debtAmount, 
                                `Ghi nợ đơn hàng #${order_id}`
                            ]
                        );
                        
                        console.log(`[Debt] Updated for customer ${customer_id}: +${debtAmount}`);
                    }
                }
            }
            channel.ack(msg);
        } catch (err) {
            console.error("Error processing debt event:", err);
            // channel.nack(msg); // Cân nhắc nack nếu muốn retry
        }
    });
};