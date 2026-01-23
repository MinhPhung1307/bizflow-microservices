import pool from '../config/db.js';
import { RoleModel } from './Role.js';
import { UserModel } from './User.js';
import { UserApprovalModel } from './UserApproval.js';
import { SubscriptionPlanModel } from './SubscriptionPlan.js';
import { AuditLogModel } from './AuditLog.js';
import { SystemConfigModel } from './SystemConfig.js';

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

    console.log("All Identity DB Tables Initialized Successfully.");
  } catch (err) {
    console.error("Critical Error during Identity DB Initialization:", err);
    // Trong môi trường production, bạn có thể muốn dừng app nếu lỗi DB
    process.exit(1); 
  }
};