import jwt from 'jsonwebtoken';
import database from '../database/db.js';
import { config } from 'dotenv';

config({ path: './config/config.env' });

/**
 * Middleware xác thực JWT Token
 */
export const verifyToken = (req, res, next) => {
    // 1. Ưu tiên tìm trong Cookie
    let token = req.cookies.jwt; 

    // 2. Dự phòng tìm trong Header
    if (!token) {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token) return res.status(401).json({ message: "Không tìm thấy Token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: "Token không hợp lệ" });
    }
};

/**
 * Middleware kiểm tra quyền ADMIN
 * Phải được gọi SAU verifyToken
 */
export const isAdmin = async (req, res, next) => {
    try {
        const userId = req.user.userId; // Lấy từ verifyToken

        // Truy vấn database để lấy tên Role của user hiện tại
        const query = `
            SELECT r.role_name 
            FROM users u
            JOIN role r ON u.role_id = r.id
            WHERE u.id = $1
        `;
        
        const result = await database.query(query, [userId]);

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

export const isOwner = async (req, res, next) => {
    try {
        // userId thường được gán vào req.user sau khi đi qua middleware verifyToken
        const userId = req.user.userId; 

        // Truy vấn database để lấy tên vai trò (role_name) của user hiện tại
        // Dựa trên bảng 'users' kết hợp với bảng 'role' qua 'role_id'
        const query = `
            SELECT r.role_name 
            FROM users u
            JOIN role r ON u.role_id = r.id
            WHERE u.id = $1
        `;
        
        const result = await database.query(query, [userId]);

        // Kiểm tra nếu không tìm thấy user trong database
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: "Không tìm thấy thông tin người dùng." 
            });
        }

        const roleName = result.rows[0].role_name;

        // Kiểm tra nếu vai trò không phải là OWNER
        // Theo yêu cầu dự án BizFlow, các vai trò chính gồm: ADMIN, OWNER, EMPLOYEE
        if (roleName !== 'OWNER') {
            return res.status(403).json({ 
                success: false,
                message: "Truy cập bị từ chối. Bạn không có quyền Chủ hộ kinh doanh." 
            });
        }

        // Nếu đúng là Owner, cho phép thực hiện các bước tiếp theo (next middleware hoặc controller)
        next();
    } catch (error) {
        console.error("Owner Check Error:", error);
        return res.status(500).json({ 
            success: false,
            message: "Lỗi hệ thống khi kiểm tra quyền hạn Chủ hộ." 
        });
    }
};