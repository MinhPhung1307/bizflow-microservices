import amqp from 'amqplib';

let channel = null;

export const connectRabbitMQ = async () => {
  try {
    // Kết nối đến RabbitMQ (thông tin lấy từ docker-compose: admin/123456)
    const amqpServer = process.env.RABBITMQ_URL || 'amqp://admin:123456@bizflow-mq:5672';
    const connection = await amqp.connect(amqpServer);
    
    channel = await connection.createChannel();
    
    // Tạo queue để lắng nghe các sự kiện liên quan đến sản phẩm/kho
    await channel.assertQueue('product_inventory_updates'); 
    
    console.log(' Connected to RabbitMQ');
    return channel;
  } catch (error) {
    console.error(' RabbitMQ Connection Failed:', error.message);
    // Có thể thêm logic retry connection ở đây nếu cần
  }
};

const consumeOrders = async () => {
    channel.consume('ORDER_CREATED', async (msg) => {
        const { items } = JSON.parse(msg.content.toString());
        
        for (const item of items) {
            // Logic trừ kho từ file ProductController cũ của bạn
            await db.query(
                `UPDATE inventory SET stock = stock - $1 WHERE product_id = $2`,
                [item.quantity, item.product_id]
            );
            await db.query(
                `UPDATE product SET stock = stock - $1 WHERE id = $2`,
                [item.quantity, item.product_id]
            );
        }
        channel.ack(msg);
    });
};

export const getChannel = () => channel;