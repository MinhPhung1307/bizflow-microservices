import amqp from 'amqplib';

let channel;
let connection;

export const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://admin:123456@bizflow-mq:5672', {
            clientProperties: {
                connection_name: `BizFlow_${process.env.SERVICE_NAME || 'OrderService'}`
            }
        });
        channel = await connection.createChannel();
        
        // Khai báo Exchange loại 'topic' hoặc 'direct' để broadcast event
        await channel.assertExchange('bizflow_event_bus', 'topic', { durable: true });
        
        console.log('Connected to RabbitMQ');
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        // Retry logic could be added here
    }
};

export const publishOrderCreated = async (orderData) => {
    if (!channel) {
        console.error('RabbitMQ channel is not available');
        return;
    }
    
    try {
        const routingKey = 'order.created';
        const msg = JSON.stringify(orderData);
        
        channel.publish('bizflow_event_bus', routingKey, Buffer.from(msg));
        console.log(`Event Published: ${routingKey}`);
    } catch (error) {
        console.error('Error publishing message:', error);
    }
};