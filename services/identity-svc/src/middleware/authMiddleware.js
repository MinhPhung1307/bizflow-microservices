import jwt from 'jsonwebtoken';
import db from '../config/db.js';

export const verifyToken = (req, res, next) => {
    // 1. Lấy token từ header hoặc cookie
    const token = req.cookies?.jwt || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Bạn cần đăng nhập để thực hiện hành động này" });
    }

    try {
        // 2. Xác thực và giải mã token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        // 3. Đưa thông tin user vào request để các controller sử dụng
        req.user = {
            id: decoded.userId,
            role: decoded.role
        };
        next();
    } catch (error) {
        return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
};

export const isAdmin = async (req, res, next) => {
    try {
        const userId = req.user.id; // Lấy từ verifyToken
        console.log(userId)

        // Truy vấn database để lấy tên Role của user hiện tại
        const query = `
            SELECT r.role_name 
            FROM users u
            JOIN role r ON u.role_id = r.id
            WHERE u.id = $1
        `;
        
        const result = await db.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy thông tin người dùng." });
        }

        const roleName = result.rows[0].role_name;

        // Kiểm tra nếu vai trò là ADMIN
        if (roleName !== 'ADMIN') {
            return res.status(403).json({ 
                message: "Truy cập bị từ chối. Bạn không có quyền Quản trị viên." 
            });
        }

        // Nếu đúng là Admin, cho phép tiếp tục
        next();
    } catch (error) {
        console.error("Admin Check Error:", error);
        return res.status(500).json({ message: "Lỗi hệ thống khi kiểm tra quyền hạn." });
    }
};