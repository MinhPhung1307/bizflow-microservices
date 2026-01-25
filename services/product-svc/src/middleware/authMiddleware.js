import jwt from 'jsonwebtoken';

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