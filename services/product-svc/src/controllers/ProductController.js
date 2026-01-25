import db from '../config/db.js';

export const getAllProducts = async (req, res) => {
  try {
    const owner_id = req.user.id; 
    
    const result = await db.query(
      'SELECT * FROM product WHERE owner_id = $1 ORDER BY created_at DESC',
      [owner_id]
    );
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error("Get All Products Error:", error);
    res.status(500).json({ success: false, message: 'Lỗi Server' });
  }
};