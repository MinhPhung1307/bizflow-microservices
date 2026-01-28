// src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const verifyToken = (req, res, next) => {
    // 1. Lấy token từ Header: "Authorization: Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Truy cập bị từ chối. Vui lòng đăng nhập.' });
    }

    try {
        // 2. Xác thực token bằng Secret Key (Dùng chung với Identity Service)
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        // 3. Lưu thông tin user vào request để Controller dùng
        req.user = decoded; 
        // req.user sẽ có dạng: { userId: '...', role: 'OWNER', ... }
        
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};