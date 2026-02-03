import amqp from 'amqplib';

let channel = null;

export const connectRabbitMQ = async () => {
  try {
    // Kết nối đến RabbitMQ (thông tin lấy từ docker-compose: admin/123456)
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://admin:123456@bizflow-mq:5672', {
        clientProperties: {
            connection_name: `BizFlow_${process.env.SERVICE_NAME || 'ProductService'}`
        }
    });
    
    channel = await connection.createChannel();
    
    // Tạo queue để lắng nghe các sự kiện liên quan đến sản phẩm/kho
    await channel.assertQueue('product_inventory_updates'); 
    await channel.assertQueue('system_audit_logs');
    
    console.log(' Connected to RabbitMQ');
    return channel;
  } catch (error) {
    console.error(' RabbitMQ Connection Failed:', error.message);
    // Có thể thêm logic retry connection ở đây nếu cần
  }
};

export const getChannel = () => channel;