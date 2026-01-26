import amqp from 'amqplib';
import { AuditLogModel } from '../models/AuditLog.js';

export const initLogConsumer = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://admin:123456@bizflow-mq:5672');
        const channel = await connection.createChannel();
        await channel.assertQueue('system_audit_logs');

        channel.consume('system_audit_logs', async (msg) => {
            if (msg !== null) {
                const logContent = JSON.parse(msg.content.toString());

                // Lưu vào Database của Identity Service
                await AuditLogModel.create({
                    user_id: logContent.user_id,
                    action: logContent.action,
                    entity_type: logContent.entity_type,
                    entity_id: logContent.entity_id,
                    new_value: logContent.new_value,
                    created_at: logContent.timestamp
                });

                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error("Log Consumer Error:", error);
    }
};