const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    // 1. Lấy token từ Header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Truy cập bị từ chối. Vui lòng đăng nhập.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        // --- LOG DEBUG ---
        console.log("👉 [DEBUG Middleware] Decoded Token:", decoded);

        // 2. Chuẩn hóa user object (Đảm bảo có cả id và userId để Controller nào cũng dùng được)
        req.user = {
            id: decoded.userId || decoded.id, // Ưu tiên userId, fallback sang id
            userId: decoded.userId || decoded.id,
            role: decoded.role
        };
        
        next();
    } catch (error) {
        console.error("Auth Error:", error.message);
        return res.status(403).json({ message: 'Token không hợp lệ.' });
    }
};

module.exports = { verifyToken };