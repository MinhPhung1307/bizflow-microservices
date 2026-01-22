import pool from '../config/db.js';
import { RoleModel } from './Role.js';
import { UserModel } from './User.js';
import { UserApprovalModel } from './UserApproval.js';
import { SubscriptionPlanModel } from './SubscriptionPlan.js';

export const initTables = async () => {
  try {
    // Thứ tự thực hiện rất quan trọng do ràng buộc khóa ngoại
    console.log("Starting DB Initialization...");

    // 1. Các bảng độc lập hoặc là bảng cha
    await pool.query(RoleModel);
    console.log("- Table 'roles' initialized");

    await pool.query(SubscriptionPlanModel);
    console.log("- Table 'subscription_plans' initialized");

    // 2. Các bảng phụ thuộc vào bảng cha (Users cần Role)
    await pool.query(UserModel);
    console.log("- Table 'users' initialized");

    // 3. Các bảng phụ thuộc vào bảng con (Approvals cần Users)
    await pool.query(UserApprovalModel);
    console.log("- Table 'user_approvals' initialized");

    console.log("All Identity DB Tables Initialized Successfully.");
  } catch (err) {
    console.error("Critical Error during Identity DB Initialization:", err);
    // Trong môi trường production, bạn có thể muốn dừng app nếu lỗi DB
    process.exit(1); 
  }
};