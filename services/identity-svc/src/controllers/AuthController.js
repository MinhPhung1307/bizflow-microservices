// src/controllers/AuthController.js
import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../config/JwtToken.js';
import jwt from 'jsonwebtoken';

// đăng ký
export const register = async (req, res) => {
    // 1. Lấy thông tin từ body
    const { full_name, shop_name, phone_number, password } = req.body;

    try {
        // 2. Kiểm tra các trường bắt buộc
        if (!full_name || !phone_number || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ họ tên, số điện thoại và mật khẩu' });
        }

        // 3. Validate định dạng dữ liệu (Mật khẩu và Số điện thoại)
        if (password.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone_number)) {
            return res.status(400).json({ message: 'Số điện thoại không hợp lệ (phải có 10 chữ số)' });
        }

        // 4. Kiểm tra số điện thoại đã tồn tại trong bảng users chưa
        const checkUser = await db.query(
            'SELECT id FROM "users" WHERE phone_number = $1',
            [phone_number]
        );

        if (checkUser.rows.length > 0) {
            return res.status(400).json({ message: 'Số điện thoại này đã được đăng ký' });
        }

        // 5. Lấy ID cho vai trò 'OWNER' (Mặc định cho người đăng ký mới)
        const roleResult = await db.query(
            'SELECT id FROM "role" WHERE role_name = $1',
            ['OWNER']
        );
        
        if (roleResult.rows.length === 0) {
            return res.status(500).json({ message: 'Lỗi cấu hình hệ thống: Vai trò OWNER không tồn tại' });
        }
        const roleId = roleResult.rows[0].id;
        
        // 6. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 7. Chèn người dùng mới vào database với trạng thái 'PENDING'
        // Lưu ý: Cột 'id' sẽ tự sinh UUID, 'status' mặc định là 'PENDING'
        const newUser = await db.query(
            `INSERT INTO "users" (full_name, shop_name, phone_number, password, role_id, status)
             VALUES ($1, $2, $3, $4, $5, 'PENDING')
             RETURNING id, full_name, status`,
            [full_name, shop_name, phone_number, hashedPassword, roleId]
        );

        const user = newUser.rows[0];

        // 8. Trả về kết quả thành công
        res.status(201).json({
            message: 'Đăng ký tài khoản thành công. Vui lòng chờ quản trị viên phê duyệt.',
            user: {
                id: user.id,
                full_name: user.full_name,
                shop_name: user.shop_name,
                phone_number: user.phone_number,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Error in register controller:', error);
        res.status(500).json({ message: 'Internal Server error' });
    }
};

// đăng nhập
export const login = async (req, res) => {
    // 1. Lấy thông tin đăng nhập từ body
    const { phone_number, password } = req.body;

    try {
        // 2. Kiểm tra các trường bắt buộc
        if (!phone_number || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập số điện thoại và mật khẩu' });
        }

        // 3. Tìm người dùng trong database bằng số điện thoại
        // JOIN với bảng role để lấy quyền hạn ngay khi đăng nhập
        const userRes = await db.query(
            `SELECT u.*, r.role_name 
             FROM "users" u 
             JOIN "role" r ON u.role_id = r.id 
             WHERE u.phone_number = $1`, 
            [phone_number]
        );

        const user = userRes.rows[0];

        // 4. Kiểm tra người dùng có tồn tại không
        if (!user) {
            return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không chính xác' });
        }

        // 5. Kiểm tra mật khẩu bằng bcryptjs
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không chính xác' });
        }

        // 6. Kiểm tra trạng thái tài khoản
        // Chỉ cho phép đăng nhập nếu trạng thái là 'ACTIVE'
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ 
                message: 'Tài khoản của bạn đang chờ phê duyệt hoặc đã bị khóa',
                status: user.status 
            });
        }

        // 7. Tạo mã Token JWT
        const token = generateToken(user.id, user.role_name, res);

        // 8. Trả về thông tin người dùng (không kèm password) và token
        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            user: {
                id: user.id,
                full_name: user.full_name,
                phone_number: user.phone_number,
                role: user.role_name,
                shop_name: user.shop_name,
                status: user.status
            },
            token: token
        });

    } catch (error) {
        console.error('Error in login controller:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi đăng nhập', error: error.message });
    }
};

// đăng xuất
export const logout = (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';

        const cookieOptions = {
            httpOnly: true,
            secure: isProduction, // Chỉ bật Secure khi chạy HTTPS (production)
            sameSite: isProduction ? 'none' : 'lax',
            path: '/' // Đảm bảo xóa cookie ở cấp độ root
        };

        // Xóa cookie 'jwt' và các cookie liên quan
        res.clearCookie('jwt', cookieOptions);
        
        // Biện pháp bổ sung: ghi đè cookie bằng giá trị rỗng và hết hạn ngay lập tức
        res.cookie('jwt', '', { ...cookieOptions, expires: new Date(0) });

        res.clearCookie('role', cookieOptions);
        res.cookie('role', '', { ...cookieOptions, expires: new Date(0) });

        res.status(200).json({ 
            success: true, 
            message: 'Đăng xuất thành công' 
        });
    } catch (error) {
        console.error('Error in logout controller:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi đăng xuất' });
    }
};

// xác thực token
export const verifyInternalToken = async (req, res) => {
    // 1. Lấy Token từ Header Authorization (Bearer <token>)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ active: false, message: "Missing token" });
    }

    try {
        // 2. Xác thực JWT nội bộ
        // Lưu ý: Biến môi trường JWT_SECRET phải khớp với lúc bạn tạo Token ở hàm register
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Truy vấn thông tin người dùng từ Database bằng UUID
        // JOIN với bảng role để lấy tên vai trò (ADMIN, OWNER...)
        const userRes = await db.query(
            `SELECT u.id, u.full_name, u.status, r.role_name, u.owner_id 
             FROM "users" u 
             JOIN "role" r ON u.role_id = r.id 
             WHERE u.id = $1`,
            [decoded.userId] // decoded.userId là trường bạn đã lưu khi generateToken
        );

        const user = userRes.rows[0];

        // 4. Kiểm tra người dùng có tồn tại và đang hoạt động không
        if (!user) {
            return res.status(404).json({ active: false, message: "User not found" });
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ active: false, message: "Account is not active" });
        }

        // 5. Trả về kết quả cho Kong Gateway
        // Kong sẽ dùng các thông tin này để đính kèm vào Header cho các service sau
        res.json({
            active: true,
            userId: user.id,
            role: user.role_name,
            ownerId: user.owner_id || user.id
        });

    } catch (error) {
        console.error('Introspection Error:', error.message);
        res.status(401).json({ active: false, message: "Invalid or expired token" });
    }
};
