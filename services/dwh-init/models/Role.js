// Lưu thông tin các vai trò (Admin, Owner, Employee).

import database from '../database/db.js';

export const createRoleTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS role (
                id BIGSERIAL PRIMARY KEY,
                role_name VARCHAR(10) UNIQUE NOT NULL -- ADMIN, OWNER, EMPLOYEE
            );
            INSERT INTO role (role_name)
            VALUES 
                ('ADMIN'),
                ('OWNER'),
                ('EMPLOYEE')
            ON CONFLICT (role_name) DO NOTHING;
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating Role table:', error); 
        process.exit(1);
    }
}