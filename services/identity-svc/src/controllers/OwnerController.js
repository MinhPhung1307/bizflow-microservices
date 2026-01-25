import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { saveLog } from '../models/AuditLog.js';
import { checkEmployeeLimit } from '../config/planLimiter.js';

// CONTROLLER quản lý Nhân viên
// Lấy danh sách nhân viên thuộc quản lý của Owner
export const getEmployees = async (req, res) => {
    const owner_id = req.user.id;
    const { search } = req.query;

    try {
        let query = `
            SELECT u.id, u.full_name, u.phone_number, u.status, u.created_at 
            FROM users u
            JOIN role r ON u.role_id = r.id
            WHERE u.owner_id = $1 AND r.role_name = 'EMPLOYEE'
        `;
        const params = [owner_id];

        if (search) {
            query += ` AND (full_name ILIKE $2 OR phone_number ILIKE $2)`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY created_at DESC`;

        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error in getEmployees:', error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách nhân viên' });
    }
};

// Tạo nhân viên
export const createEmployee = async (req, res) => {
    const { full_name, phone_number, password } = req.body;
    const owner_id = req.user.id;

    try {
        // 1. Kiểm tra các trường bắt buộc
        if (!full_name || !phone_number || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ họ tên, số điện thoại và mật khẩu' });
        }

        // 2. Validate định dạng dữ liệu (Giống logic signup) 
        if (password.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu nhân viên phải có ít nhất 6 ký tự' });
        }
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone_number)) {
            return res.status(400).json({ message: 'Số điện thoại không hợp lệ (phải có 10 chữ số)' });
        }

        // 3. Kiểm tra số điện thoại đã tồn tại trong hệ thống chưa
        const checkUser = await db.query(
            'SELECT id FROM "users" WHERE phone_number = $1',
            [phone_number]
        );
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng cho một tài khoản khác' });
        }

        // 4. KIỂM TRA GIỚI HẠN GÓI DỊCH VỤ (PLAN LIMIT)
        const canCreate = await checkEmployeeLimit(owner_id);
        if (!canCreate) {
            return res.status(403).json({ 
                success: false, 
                message: 'Bạn đã đạt giới hạn số lượng nhân viên của gói hiện tại. Vui lòng nâng cấp gói để thêm mới!' 
            });
        }

        // 5. Hash mật khẩu cho nhân viên
        const hashedPassword = await bcrypt.hash(password, 10);

        // 6. Cấu hình mặc định cho Employee:
        // - role_id = 3 (Nhân viên)
        // - status = 'ACTIVE' (Nhân viên do Owner tạo thì hoạt động ngay)
        // - owner_id = ID của người tạo (Owner) để quản lý theo cửa hàng
        const role_id = 3; 
        const status = 'ACTIVE';

        // 7. Lưu vào Database
        const newUser = await db.query(
            `
                INSERT INTO "users"
                (full_name, phone_number, password, role_id, status, owner_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, full_name, phone_number, status, created_at
            `,
            [full_name, phone_number, hashedPassword, role_id, status, owner_id]
        );

        if (newUser.rows.length > 0) {
            await saveLog(db, {
                user_id: owner_id,
                action: 'CREATE_EMPLOYEE',
                entity_type: 'users',
                entity_id: newUser.rows[0].id,
                new_value: { full_name: newUser.rows[0].full_name, phone: newUser.rows[0].phone_number }
            });
            return res.status(201).json({
                success: true,
                message: 'Tạo tài khoản nhân viên thành công!',
                data: newUser.rows[0]
            });
        } else {
            return res.status(400).json({ message: 'Không thể tạo tài khoản nhân viên, dữ liệu không hợp lệ' });
        }

    } catch (error) {
        console.error('Error in createEmployee controller:', error);
        return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
};

// Khóa hoặc Mở khóa tài khoản nhân viên
export const toggleStaffStatus = async (req, res) => {
    const { id } = req.params;
    const owner_id = req.user.id;

    try {
        // Kiểm tra xem nhân viên có thuộc quyền quản lý của Owner không
        const checkStaff = await db.query(
            'SELECT id, status FROM users WHERE id = $1 AND owner_id = $2',
            [id, owner_id]
        );

        if (checkStaff.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
        }

        const currentStatus = checkStaff.rows[0].status;
        const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';

        await db.query(
            'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
            [newStatus, id]
        );

        await saveLog(db, {
            user_id: owner_id,
            action: newStatus === 'ACTIVE' ? 'UNLOCK_ACCOUNT' : 'LOCK_ACCOUNT',
            entity_type: 'users',
            entity_id: id,
            old_value: { status: currentStatus },
            new_value: { status: newStatus }
        });

        res.status(200).json({ success: true, message: `Đã cập nhật trạng thái thành ${newStatus}` });
    } catch (error) {
        console.error('Error in toggleStaffStatus:', error);
        res.status(500).json({ message: 'Lỗi cập nhật trạng thái' });
    }
};

// Đổi mật khẩu nhân viên
export const changeStaffPassword = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    const owner_id = req.user.id;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2 AND owner_id = $3',
            [hashedPassword, id, owner_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
        }

        res.status(200).json({ success: true, message: 'Đã đổi mật khẩu nhân viên thành công' });
    } catch (error) {
        console.error('Error in changeStaffPassword:', error);
        res.status(500).json({ message: 'Lỗi khi đổi mật khẩu' });
    }
};

// Xóa nhân viên
export const deleteEmployee = async (req, res) => {
    const { id } = req.params;
    const owner_id = req.user.id;

    try {

        const staffRes = await db.query(
            'SELECT full_name, phone_number FROM users WHERE id = $1 AND owner_id = $2',
            [id, owner_id]
        );
        if (staffRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
        }
        const oldData = staffRes.rows[0];

        await db.query(
            'DELETE FROM users WHERE id = $1 AND owner_id = $2 AND role_id = 3',
            [id, owner_id]
        );

        await saveLog(db, {
            user_id: owner_id,
            action: 'DELETE_EMPLOYEE',
            entity_type: 'users',
            entity_id: id,
            old_value: oldData
        });

        res.status(200).json({ success: true, message: 'Đã xóa nhân viên thành công' });
    } catch (error) {
        console.error('Error in deleteEmployee:', error);
        // Nếu nhân viên đã có dữ liệu liên quan (như hóa đơn), nên báo lỗi ràng buộc
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Không thể xóa nhân viên này vì đã có dữ liệu giao dịch liên quan. Hãy sử dụng chức năng "Khóa" thay thế.' });
        }
        res.status(500).json({ message: 'Lỗi khi xóa nhân viên' });
    }
};


// CONTROLLER quản lý audit log
// Lấy log
export const getAuditLogs = async (req, res) => {
    const owner_id = req.user.id; // ID của Owner từ middleware verifyToken
    const { search } = req.query;

    try {
        let query = `
            SELECT 
                al.id, 
                al.action, 
                al.entity_type, 
                al.entity_id,
                al.old_value, 
                al.new_value, 
                al.created_at,
                u.full_name AS user_name,
                r.role_name
            FROM audit_log al
            JOIN users u ON al.user_id = u.id
            LEFT JOIN role r ON u.role_id = r.id
            WHERE (u.id = $1 OR u.owner_id = $1)
        `;
        const params = [owner_id];

        if (search) {
            query += ` AND (u.full_name ILIKE $2 OR al.action ILIKE $2 OR al.entity_type ILIKE $2)`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY al.created_at DESC LIMIT 200`; 

        const result = await db.query(query, params);
        
        const data = result.rows.map(log => ({
            ...log,
            description: `${log.action} trên ${log.entity_type} (ID: ${log.entity_id || 'N/A'})`
        }));

        res.status(200).json(data);
    } catch (error) {
        console.error('Error in getAuditLogs:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi lấy nhật ký hoạt động' });
    }
};

// Xóa toàn bộ nhật ký của cửa hàng
export const clearAuditLogs = async (req, res) => {
    const owner_id = req.user.id;
    try {
        // Chỉ xóa những log thuộc về owner này hoặc nhân viên của owner này
        const query = `
            DELETE FROM audit_log 
            WHERE user_id IN (
                SELECT id FROM users WHERE id = $1 OR owner_id = $1
            )
        `;
        await db.query(query, [owner_id]);

        res.status(200).json({ success: true, message: 'Đã xóa toàn bộ nhật ký hoạt động' });
    } catch (error) {
        console.error('Error in clearAuditLogs:', error);
        res.status(500).json({ message: 'Lỗi khi xóa nhật ký' });
    }
};

// xóa log theo id
export const deleteAuditLog = async (req, res) => {
    const { id } = req.params;
    const owner_id = req.user.id;

    try {
        const query = `
            DELETE FROM audit_log 
            WHERE id = $1 AND user_id IN (
                SELECT id FROM users WHERE id = $2 OR owner_id = $2
            )
            RETURNING id
        `;
        const result = await db.query(query, [id, owner_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi hoặc bạn không có quyền xóa' });
        }

        res.status(200).json({ success: true, message: 'Đã xóa bản ghi nhật ký thành công' });
    } catch (error) {
        console.error('Error in deleteAuditLog:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi xóa nhật ký' });
    }
};
