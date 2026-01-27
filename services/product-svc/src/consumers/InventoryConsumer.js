const amqp = require('amqplib');
const { Inventory, StockTransaction, sequelize } = require('../models');

const consumeOrderCreated = async () => {
    try {
        const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
        const connection = await amqp.connect(rabbitUrl);
        const channel = await connection.createChannel();
        const queue = 'order_created_queue';

        await channel.assertQueue(queue, { durable: true });
        console.log(`🐰 Waiting for messages in ${queue}...`);

        channel.consume(queue, async (msg) => {
            if (msg !== null) {
                const orderData = JSON.parse(msg.content.toString());
                console.log('📦 Received Order:', orderData.order_id);

                const t = await sequelize.transaction();

                try {
                    for (const item of orderData.items) {
                        // 1. Tìm kho
                        const inventory = await Inventory.findOne({ 
                            where: { product_id: item.product_id },
                            transaction: t 
                        });

                        if (inventory) {
                            // 2. Trừ tồn kho
                            inventory.quantity -= item.quantity;
                            await inventory.save({ transaction: t });

                            // 3. Ghi lịch sử giao dịch (StockTransaction)
                            await StockTransaction.create({
                                product_id: item.product_id,
                                transaction_type: 'OUT',
                                quantity: item.quantity,
                                reason: `Order #${orderData.order_id}`,
                                reference_id: orderData.order_id.toString()
                            }, { transaction: t });
                        }
                    }

                    await t.commit();
                    console.log(`✅ Inventory updated for Order #${orderData.order_id}`);
                    channel.ack(msg);
                } catch (err) {
                    await t.rollback();
                    console.error('❌ Error updating inventory:', err);
                    // channel.nack(msg); // Cân nhắc dùng nack nếu muốn thử lại
                }
            }
        });
    } catch (error) {
        console.error('❌ RabbitMQ Connection Error:', error);
    }
};

module.exports = consumeOrderCreated;