import amqp from 'amqplib';
import db from '../config/db.js';

export const initLogConsumer = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://admin:123456@bizflow-mq:5672');
        // Tự động kết nối lại khi RabbitMQ lỗi
        connection.on("error", (err) => {
            console.error("Lỗi kết nối RabbitMQ, đang thử lại...");
            setTimeout(initLogConsumer, 5000);
        });
        const channel = await connection.createChannel();
        await channel.assertQueue('system_audit_logs', { durable: true });

        console.log("Identity Service đã kết nối RabbitMQ và đang lắng nghe...");

        channel.consume('system_audit_logs', async (msg) => {
            if (msg !== null) {
                try {
                    const logContent = JSON.parse(msg.content.toString());
                    console.log("Nhận log từ Product-Svc:", logContent.action);

                    const sql = `
                        INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_value, created_at)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `;
                    
                    const values = [
                        logContent.user_id,
                        logContent.action,
                        logContent.entity_type,
                        logContent.entity_id,
                        logContent.new_value, 
                        logContent.timestamp || new Date()
                    ];

                    // Sử dụng dbInstance.query từ file bạn gửi
                    await db.query(sql, values);

                    console.log("Đã ghi log vào Database Identity thành công.");
                    
                    // Xác nhận đã xử lý xong tin nhắn
                    channel.ack(msg);
                } catch (error) {
                    console.error("Lỗi khi xử lý tin nhắn log:", error.message);
                    // Nếu lỗi do code, không ack để tin nhắn quay lại queue chờ xử lý lại sau khi sửa code
                }
            }
        });
    } catch (error) {
        console.error("Log Consumer Error:", error);
    }
};