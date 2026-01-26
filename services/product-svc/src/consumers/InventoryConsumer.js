const amqp = require('amqplib');
const { Inventory, StockTransaction, sequelize } = require('../models');

// URL RabbitMQ (nên để trong .env)
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

const consumeOrderCreated = async () => {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        
        const exchange = 'order_exchange';
        const queue = 'product_service_inventory_queue';
        const routingKey = 'order.created';

        await channel.assertExchange(exchange, 'topic', { durable: true });
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, exchange, routingKey);

        console.log(` [*] Listening for '${routingKey}' events in '${queue}'`);

        channel.consume(queue, async (msg) => {
            if (msg.content) {
                const orderData = JSON.parse(msg.content.toString());
                console.log(" [x] Processing Order:", orderData.order_id);

                const t = await sequelize.transaction();
                try {
                    // Duyệt qua từng sản phẩm trong đơn hàng để trừ kho
                    for (const item of orderData.items) {
                        const inventory = await Inventory.findOne({ 
                            where: { product_id: item.product_id } 
                        });

                        if (!inventory) {
                            console.error(`Product ${item.product_id} not found in inventory`);
                            continue; 
                        }

                        // Trừ số lượng tồn kho
                        await inventory.decrement('quantity', { 
                            by: item.quantity, 
                            transaction: t 
                        });

                        // Ghi log lịch sử giao dịch (Xuất kho bán hàng)
                        await StockTransaction.create({
                            product_id: item.product_id,
                            quantity_change: -item.quantity, // Số âm
                            transaction_type: 'SALE',
                            reference_id: `ORDER_${orderData.order_id}`,
                            note: `Xuất kho bán hàng đơn #${orderData.order_id}`,
                            performed_by: orderData.employee_id
                        }, { transaction: t });
                    }

                    await t.commit();
                    console.log(" [x] Inventory updated successfully.");
                    channel.ack(msg); // Xác nhận đã xử lý xong
                } catch (err) {
                    await t.rollback();
                    console.error(" [!] Error updating inventory:", err.message);
                    channel.nack(msg, false, false); // Trả lại hàng đợi hoặc đẩy vào DLQ
                }
            }
        });
    } catch (error) {
        console.error("RabbitMQ Consumer Error:", error);
    }
};

module.exports = consumeOrderCreated;