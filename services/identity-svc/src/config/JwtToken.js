import jwt from 'jsonwebtoken';

export const generateToken = (userId, role, res) => {
    // Chỉ lấy biến ra dùng, không cần config lại
    const secret = process.env.JWT_SECRET_KEY; 

    if (!secret) {
        console.log("Lỗi: Không tìm thấy JWT_SECRET_KEY trong môi trường!");
        throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign({ userId }, secret, {
        expiresIn: '7d',
    });

    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions = {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        httpOnly: true, // Bảo mật, tránh XSS
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
    };

    res.cookie('jwt', token, cookieOptions);
    res.cookie('role', role, cookieOptions);

    return token;
};