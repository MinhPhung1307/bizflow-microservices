import amqp from 'amqplib';
import db from './db.js'; 

let channel = null;

export const connectRabbitMQ = async () => {
  try {
    const amqpServer = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    const connection = await amqp.connect(amqpServer);
    
    channel = await connection.createChannel();
    
    // Khai báo Exchange (phải giống bên Order Service)
    const exchangeName = 'bizflow_event_bus';
    await channel.assertExchange(exchangeName, 'topic', { durable: true });

    // Tạo Queue riêng cho Product Service
    const q = await channel.assertQueue('product_inventory_queue', { durable: true });

    // Bind Queue vào Exchange với routing key 'order.created'
    await channel.bindQueue(q.queue, exchangeName, 'order.created');
    
    console.log('Product Service connected to RabbitMQ & Listening...');
    
    // Bắt đầu tiêu thụ tin nhắn
    consumeOrders(q.queue);
    
    return channel;
  } catch (error) {
    console.error('RabbitMQ Connection Failed:', error.message);
    // Retry logic sau 5s nếu mất kết nối
    setTimeout(connectRabbitMQ, 5000);
  }
};

const consumeOrders = async (queueName) => {
    channel.consume(queueName, async (msg) => {
        if (!msg) return;

        try {
            const data = JSON.parse(msg.content.toString());
            const { event, payload } = data;

            // Chỉ xử lý sự kiện ORDER_CREATED
            if (event === 'ORDER_CREATED') {
                const { items } = payload;
                console.log(`📦 Processing stock update for Order #${payload.order_id}`);

                for (const item of items) {
                    // Cập nhật bảng inventory
                    await db.query(
                        `UPDATE inventory SET stock = stock - $1 WHERE product_id = $2`,
                        [item.quantity, item.product_id]
                    );
                    
                    // Cập nhật bảng product (để đồng bộ hiển thị)
                    await db.query(
                        `UPDATE product SET stock = stock - $1 WHERE id = $2`,
                        [item.quantity, item.product_id]
                    );
                }
                console.log(`Stock updated for Order #${payload.order_id}`);
            }

            // Xác nhận đã xử lý xong
            channel.ack(msg);
        } catch (error) {
            console.error("Error processing order event:", error);
            // Nếu lỗi, có thể nack (không xác nhận) để đẩy lại hàng đợi hoặc đẩy vào DLQ
            // channel.nack(msg, false, false); 
        }
    });
};

export const getChannel = () => channel;