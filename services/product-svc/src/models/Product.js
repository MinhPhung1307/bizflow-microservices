import pool from '../config/db.js';

export const ProductModel = {
  // Lấy tất cả sản phẩm kèm số lượng tồn kho
  findAll: async () => {
    const query = `
      SELECT p.id, p.name, p.sku, p.base_price, p.image_url, 
             p.category_id, p.barcode,
             COALESCE(i.quantity, 0) as stock_quantity
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      ORDER BY p.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  // Tìm sản phẩm theo ID
  findById: async (id) => {
    const query = `SELECT * FROM products WHERE id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },

  // Tạo sản phẩm mới
  create: async (data) => {
    const { name, sku, base_price, category_id, image_url, barcode, description } = data;
    const query = `
      INSERT INTO products (name, sku, base_price, category_id, image_url, barcode, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [name, sku, base_price, category_id, image_url, barcode, description];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // Khởi tạo tồn kho (chạy ngay sau khi tạo sản phẩm)
  initInventory: async (productId) => {
    const query = `INSERT INTO inventory (product_id, quantity) VALUES ($1, 0) RETURNING *`;
    await pool.query(query, [productId]);
  }
};