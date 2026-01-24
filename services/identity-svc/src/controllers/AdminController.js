// src/controllers/AuthController.js
import db from '../config/db.js';

// 1. Lấy danh sách tất cả các Owner để quản lý
export const getAllOwners = async (req, res) => {
    const { status } = req.query;
    try {
        // Query sử dụng LEFT JOIN với subquery để lấy lý do mới nhất
        let query = `
            SELECT 
                u.id, u.full_name, u.phone_number, u.status, u.created_at, u.shop_name, u.plan_id,
                ua.reason as rejection_reason
            FROM users u
            LEFT JOIN (
                SELECT DISTINCT ON (user_id) user_id, reason, created_at
                FROM user_approvals
                WHERE action = 'REJECTED'
                ORDER BY user_id, created_at DESC
            ) ua ON u.id = ua.user_id
            JOIN role r ON u.role_id = r.id
            WHERE r.role_name = 'OWNER'
        `;
        const values = [];

        // Nếu có truyền status, thêm điều kiện lọc vào câu query
        if (status && status !== 'ALL') {
            query += ` AND u.status = $1`;
            values.push(status);
        }

        query += ` ORDER BY u.created_at DESC`;
        
        const result = await db.query(query, values);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get All Owners Error:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách Owner" });
    }
};