import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { RoleModel } from './Role.js';
import { UserModel } from './User.js';
import { UserApprovalModel } from './UserApproval.js';
import { SubscriptionPlanModel } from './SubscriptionPlan.js';
import { AuditLogModel } from './AuditLog.js';
import { SystemConfigModel } from './SystemConfig.js';

const initAdmin = async () => {

    const adminPhone = process.env.ADMIN_PHONE;
    const adminPass = process.env.ADMIN_PASSWORD;
    const adminName = 'Hệ Thống Admin';

    try {
        // Lấy ID của vai trò ADMIN
        const roleRes = await pool.query(
            'SELECT id FROM "role" WHERE role_name = $1',
            ['ADMIN']
        );
        
        if (roleRes.rows.length === 0) return;
        const adminRoleId = roleRes.rows[0].id;

        // Hash mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPass, salt);

        // Tạo tài khoản Admin với trạng thái ACTIVE
        await pool.query(
            `INSERT INTO "users" (full_name, phone_number, password, role_id, status)
             VALUES ($1, $2, $3, $4, 'ACTIVE')`,
            [adminName, adminPhone, hashedPassword, adminRoleId]
        );

        console.log(`Đã khởi tạo tài khoản Admin mặc định: ${adminPhone}`);
    } catch (error) {
        console.error('Lỗi khi khởi tạo Admin:', error.message);
    }
};

export const initTables = async () => {
  try {
    // Thứ tự thực hiện rất quan trọng do ràng buộc khóa ngoại
    console.log("Starting DB Initialization...");

    // 1. Các bảng độc lập hoặc là bảng cha
    await pool.query(RoleModel);
    await pool.query(SubscriptionPlanModel);
    await pool.query(SystemConfigModel);

    // 2. Các bảng phụ thuộc vào bảng cha (Users cần Role)
    await pool.query(UserModel);

    // 3. Các bảng phụ thuộc vào bảng con (Approvals cần Users)
    await pool.query(UserApprovalModel);
    await pool.query(AuditLogModel);

    await initAdmin();

    console.log("All Identity DB Tables Initialized Successfully.");
  } catch (err) {
    console.error("Critical Error during Identity DB Initialization:", err);
    // Trong môi trường production, bạn có thể muốn dừng app nếu lỗi DB
    process.exit(1); 
  }
};