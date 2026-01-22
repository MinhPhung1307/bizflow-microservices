import pg from 'pg';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false, 
  },
});

pool.on('connect', () => {
  console.log('Đã kết nối thành công tới database Neon DWH.');
});

pool.on('error', (err) => {
  console.error('Lỗi kết nối database bất ngờ:', err);
  process.exit(-1);
});

export default {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
};