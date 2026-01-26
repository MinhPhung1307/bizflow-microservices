import amqp from 'amqplib';

let channel;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
        channel = await connection.createChannel();
        await channel.assertQueue('ORDER_CREATED'); // Queue thông báo đơn hàng mới
        console.log("Connected to RabbitMQ");
    } catch (error) {
        console.error("RabbitMQ Connection Error:", error);
    }
};

export const publishOrderCreated = (orderData) => {
    if (!channel) return;
    channel.sendToQueue('ORDER_CREATED', Buffer.from(JSON.stringify(orderData)));
};    