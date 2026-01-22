// src/controllers/AuthController.js
import admin from '../config/firebase.js';
import pool from '../config/db.js';

export const syncUserWithFirebase = async (req, res) => {
    const { idToken, full_name, phone_number, shop_name, role_name } = req.body;

    try {
        // 1. Xác thực Token từ Firebase gửi lên
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid } = decodedToken;

        // 2. Lấy role_id tương ứng
        const roleRes = await pool.query('SELECT id FROM roles WHERE role_name = $1', [role_name]);
        const roleId = roleRes.rows[0].id;

        // 3. Lưu vào database nội bộ để quản lý nghiệp vụ BizFlow
        const newUser = await pool.query(
            `INSERT INTO users (firebase_uid, full_name, phone_number, shop_name, role_id, status)
             VALUES ($1, $2, $3, $4, $5, 'PENDING') 
             ON CONFLICT (firebase_uid) DO NOTHING RETURNING *`,
            [uid, full_name, phone_number, shop_name, roleId]
        );

        res.status(201).json({ success: true, user: newUser.rows[0] });
    } catch (error) {
        res.status(401).json({ message: "Token không hợp lệ hoặc lỗi DB", error: error.message });
    }
};

// Hàm dành cho Kong API Gateway gọi để kiểm tra quyền hạn (Introspection)
export const verifyInternalToken = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        const userRes = await pool.query(
            'SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.firebase_uid = $1',
            [decoded.uid]
        );
        
        if (userRes.rows.length === 0) return res.status(404).json({ active: false });
        
        // Trả về thông tin để Gateway đính kèm vào Header gửi cho các Service sau
        res.json({
            active: true,
            uid: decoded.uid,
            role: userRes.rows[0].role_name,
            owner_id: userRes.rows[0].owner_id || decoded.uid
        });
    } catch (e) {
        res.status(401).json({ active: false });
    }
};