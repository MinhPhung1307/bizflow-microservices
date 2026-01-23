import jwt from 'jsonwebtoken';

export const generateToken = (userId, res) => {
    // Chỉ lấy biến ra dùng, không cần config lại
    const secret = process.env.JWT_SECRET_KEY; 

    if (!secret) {
        console.log("Lỗi: Không tìm thấy JWT_SECRET_KEY trong môi trường!");
        throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign({ userId }, secret, {
        expiresIn: '7d',
    });

    res.cookie('jwt', token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
    });

    return token;
};