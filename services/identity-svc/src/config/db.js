import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

class Database {
    static instance;

    constructor() {
        // Kiểm tra nếu thực thể (instance) đã tồn tại thì trả về thực thể đó
        if (Database.instance) {
            return Database.instance;
        }

        // Khởi tạo Pool
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false} : false,
        });

        // Lắng nghe lỗi kết nối để tránh sập ứng dụng đột ngột
        this.pool.on('error', (err) => {
            console.error('Lỗi PostgreSQL Pool không mong muốn:', err.message);
        });

        // Gán thực thể vừa tạo vào biến static
        Database.instance = this;
    }

    query(text, params) {
        return this.pool.query(text, params);
    }

    connect() {
        return this.pool.connect();
    }
}

// Khởi tạo thực thể duy nhất và xuất ra ngoài
const dbInstance = new Database();
export default dbInstance;