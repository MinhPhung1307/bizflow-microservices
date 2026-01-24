import pool from '../config/db.js';

export const InventoryModel = {
  // Lấy thông tin tồn kho của 1 sản phẩm
  getByProductId: async (productId) => {
    const query = 'SELECT * FROM inventory WHERE product_id = $1';
    const { rows } = await pool.query(query, [productId]);
    return rows[0];
  },

  // Cập nhật số lượng (transaction an toàn)
  // quantityChange: số dương để nhập hàng, số âm để xuất hàng
  updateStock: async (productId, quantityChange) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN'); // Bắt đầu transaction

      // Dùng UPSERT: Nếu chưa có thì tạo mới, có rồi thì cộng dồn
      const query = `
        INSERT INTO inventory (product_id, quantity, last_updated)
        VALUES ($1, $2, NOW())
        ON CONFLICT (product_id)
        DO UPDATE SET 
          quantity = inventory.quantity + $2,
          last_updated = NOW()
        RETURNING *
      `;
      
      const { rows } = await client.query(query, [productId, quantityChange]);
      
      // Kiểm tra nếu tồn kho bị âm (tùy nghiệp vụ có cho phép bán âm không)
      if (rows[0].quantity < 0) {
        throw new Error(`Sản phẩm ${productId} không đủ tồn kho`);
      }

      await client.query('COMMIT'); // Lưu thay đổi
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK'); // Hủy bỏ nếu lỗi
      throw error;
    } finally {
      client.release();
    }
  }
};