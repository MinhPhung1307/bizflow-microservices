// src/config/db.js
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

class Database {
    static instance;

    constructor() {
        if (Database.instance) {
            return Database.instance;
        }

        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false,
            },
        });

        this.pool.on('error', (err) => {
            console.error('Lỗi PostgreSQL Pool:', err.message);
        });

        Database.instance = this;
    }

    query(text, params) {
        return this.pool.query(text, params);
    }
}

const dbInstance = new Database();
export default dbInstance;