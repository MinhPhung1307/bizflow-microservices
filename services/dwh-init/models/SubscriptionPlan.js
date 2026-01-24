import database from '../database/db.js';

export const createSubscriptionPlanTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS subscription_plan (
                id SERIAL PRIMARY KEY,
                plan_name VARCHAR(50) UNIQUE NOT NULL, -- Basic, Pro, Enterprise
                price DECIMAL(19, 2) NOT NULL CHECK (price >= 0),
                duration_days INT NOT NULL, -- Số ngày hiệu lực (vd: 30, 365)
                features JSONB DEFAULT '[]'::JSONB, -- Danh sách tính năng đi kèm

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating SubscriptionPlan table:', error);
    }
}