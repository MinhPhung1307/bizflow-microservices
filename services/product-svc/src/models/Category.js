import pool from '../config/db.js';

export const CategoryModel = {
  // Lấy tất cả danh mục
  findAll: async () => {
    const query = 'SELECT * FROM categories ORDER BY name ASC';
    const { rows } = await pool.query(query);
    return rows;
  },

  // Tạo danh mục mới
  create: async (name, description) => {
    const query = `
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [name, description]);
    return rows[0];
  }
};