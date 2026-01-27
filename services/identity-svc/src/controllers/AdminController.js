// src/controllers/AdminController.js
import db from '../config/db.js';
import bcrypt from 'bcryptjs';

// CONTROLLER Quản lý Owner
// Lấy danh sách tất cả các Owner để quản lý
export const getAllOwners = async (req, res) => {
    const { status } = req.query;
    try {
        // Query sử dụng LEFT JOIN với subquery để lấy lý do mới nhất
        let query = `
            SELECT 
                u.id, u.full_name, u.phone_number, u.status, u.created_at, u.shop_name, u.plan_id,
                ua.reason as rejection_reason
            FROM users u
            LEFT JOIN (
                SELECT DISTINCT ON (user_id) user_id, reason, created_at
                FROM user_approvals
                WHERE action = 'REJECTED'
                ORDER BY user_id, created_at DESC
            ) ua ON u.id = ua.user_id
            JOIN role r ON u.role_id = r.id
            WHERE r.role_name = 'OWNER'
        `;
        const values = [];

        // Nếu có truyền status, thêm điều kiện lọc vào câu query
        if (status && status !== 'ALL') {
            query += ` AND u.status = $1`;
            values.push(status);
        }

        query += ` ORDER BY u.created_at DESC`;
        
        const result = await db.query(query, values);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get All Owners Error:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách Owner" });
    }
};

// Admin tạo tài khoản Owner mới
export const createOwner = async (req, res) => {
    const { full_name, phone_number, password, shop_name } = req.body;

    try {
        // 1. Validate cơ bản
        if (!full_name || !phone_number || !password) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
        }

        // 2. Validate độ dài mật khẩu
        if (password.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        // 3. Validate định dạng số điện thoại (10 chữ số)
        const regex = /^\d{10}$/;
        if (!regex.test(phone_number)) {
            return res.status(400).json({ message: 'Số điện thoại không hợp lệ (phải có 10 chữ số)' });
        }

        // 4. Kiểm tra số điện thoại đã tồn tại chưa
        const checkUser = await db.query(
            'SELECT id FROM users WHERE phone_number = $1',
            [phone_number]
        );
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ message: "Số điện thoại này đã được đăng ký" });
        }

        // 5. Lấy role_id của 'OWNER'
        const roleResult = await db.query("SELECT id FROM role WHERE role_name = 'OWNER'");
        if (roleResult.rows.length === 0) {
            return res.status(500).json({ message: "Lỗi hệ thống: Không tìm thấy role OWNER" });
        }
        const ownerRoleId = roleResult.rows[0].id;

        // 6. Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // 7. Tạo user mới
        const query = `
            INSERT INTO users (full_name, phone_number, password, role_id, status, shop_name)
            VALUES ($1, $2, $3, $4, 'ACTIVE', $5)
            RETURNING id, full_name, phone_number, shop_name, created_at
        `;
        const newUser = await db.query(query, [full_name, phone_number, hashedPassword, ownerRoleId, shop_name]);

        res.status(201).json({
            message: "Tạo tài khoản Owner thành công",
            data: newUser.rows[0]
        });

    } catch (error) {
        console.error("Create Owner Error:", error);
        res.status(500).json({ message: "Lỗi server khi tạo Owner" });
    }
};

// Cập nhật thông tin Owner (Sửa tên, SĐT, Reset Pass)
export const updateOwner = async (req, res) => {
    const { id } = req.params;
    const { full_name, phone_number, password, shop_name } = req.body;

    try {
        // 1. Kiểm tra ID
        if (!id) return res.status(400).json({ message: "Thiếu ID người dùng" });

        // 2. Validate SĐT (nếu có thay đổi)
        if (phone_number) {
            const checkPhone = await db.query(
                'SELECT id FROM users WHERE phone_number = $1 AND id != $2',
                [phone_number, id]
            );
            if (checkPhone.rows.length > 0) {
                return res.status(400).json({ message: "Số điện thoại đã được sử dụng bởi tài khoản khác" });
            }
        }

        // 3. Xây dựng câu truy vấn động (chỉ update trường nào có gửi lên)
        let updateFields = [];
        let values = [];
        let index = 1;

        if (full_name) {
            updateFields.push(`full_name = $${index++}`);
            values.push(full_name);
        }
        if (phone_number) {
            updateFields.push(`phone_number = $${index++}`);
            values.push(phone_number);
        }
        if (password && password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push(`password = $${index++}`);
            values.push(hashedPassword);
        }
        if (shop_name) {
            updateFields.push(`shop_name = $${index++}`);
            values.push(shop_name);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: "Không có dữ liệu nào để cập nhật" });
        }

        // Thêm ID vào cuối mảng values cho WHERE clause
        values.push(id);
        
        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')}, updated_at = NOW() 
            WHERE id = $${index}
            RETURNING id, full_name, phone_number
        `;

        const result = await db.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        res.status(200).json({ 
            message: "Cập nhật thành công", 
            data: result.rows[0] 
        });

    } catch (error) {
        console.error("Update Owner Error:", error);
        res.status(500).json({ message: "Lỗi server khi cập nhật Owner" });
    }
};

// Xóa Owner
export const deleteOwner = async (req, res) => {
    const { id } = req.params;

    try {
        // Kiểm tra xem user có tồn tại và đúng là OWNER không (tránh xóa nhầm ADMIN)
        const checkQuery = `
            SELECT u.id, r.role_name 
            FROM users u
            JOIN role r ON u.role_id = r.id
            WHERE u.id = $1
        `;
        const checkResult = await db.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        if (checkResult.rows[0].role_name === 'ADMIN') {
            return res.status(403).json({ message: "Không thể xóa tài khoản Admin tại đây" });
        }

        // Thực hiện xóa
        const deleteQuery = 'DELETE FROM users WHERE id = $1 RETURNING id';
        await db.query(deleteQuery, [id]);

        res.status(200).json({ message: "Đã xóa tài khoản chủ cửa hàng thành công" });

    } catch (error) {
        console.error("Delete Owner Error:", error);
        res.status(500).json({ message: "Lỗi server khi xóa tài khoản" });
    }
};

// Duyệt, Kích hoạt hoặc Khóa tài khoản Owner
export const toggleOwnerStatus = async (req, res) => {
    const { ownerId, status, reason } = req.body;  
    const adminId = req.user.id;

    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        const updateUserQuery = `
            UPDATE users SET status = $1, updated_at = NOW() 
            WHERE id = $2 RETURNING id, full_name, status
        `;
        const userResult = await client.query(updateUserQuery, [status, ownerId]);

        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: "Không tìm thấy tài khoản" });
        }

        const insertLogQuery = `
            INSERT INTO user_approvals (user_id, admin_id, action, reason)
            VALUES ($1, $2, $3, $4)
        `;
        // Ghi lại lý do nếu có (đặc biệt quan trọng cho REJECTED)
        await client.query(insertLogQuery, [ownerId, adminId, status, reason || null]);

        await client.query('COMMIT');

        res.status(200).json({ 
            message: "Cập nhật trạng thái thành công", 
            data: userResult.rows[0] 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Update Status Error:", error);
        res.status(500).json({ message: "Lỗi khi cập nhật trạng thái" });
    } finally {
        client.release();
    }
};

// Đổi gói cho Owner
export const changeOwnerPlan = async (req, res) => {
    const { ownerId, planId } = req.body;
    console.log(ownerId, planId)

    try {
        // Kiểm tra kỹ hơn: chỉ báo lỗi nếu planId là null hoặc undefined (cho phép số 0 nếu DB bạn dùng ID 0, nhưng thường là từ 1)
        if (!ownerId || planId === undefined || planId === null) {
            return res.status(400).json({ 
                message: "Thiếu thông tin Owner hoặc Plan",
                received: req.body 
            });
        }
        
        // Chặn nếu planId = 0 hoặc rỗng (nếu gói dịch vụ bắt đầu từ ID 1)
        if (Number(planId) <= 0) {
             return res.status(400).json({ message: "Vui lòng chọn một gói dịch vụ hợp lệ" });
        }
        // 2. Cập nhật gói trong DB
        // Lưu ý: Cần ép kiểu planId về số nguyên nếu DB để cột id là Serial/Int
        const query = `
            UPDATE users 
            SET plan_id = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, full_name, plan_id
        `;
        
        const result = await db.query(query, [parseInt(planId), ownerId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Không tìm thấy User này" });
        }

        res.status(200).json({ 
            message: "Cập nhật gói thành công", 
            data: result.rows[0] 
        });

    } catch (error) {
        console.error("Change Plan Error:", error);
        res.status(500).json({ message: "Lỗi server khi đổi gói" });
    }
};


// CONTROLLER Quản lý Gói dịch vụ
// Lấy danh sách tất cả các gói
export const getSubscriptionPlans = async (req, res) => {
    try {
        const query = `
            SELECT id, plan_name, price, duration_days, features, created_at
            FROM subscription_plan
            ORDER BY price ASC
        `;
        const result = await db.query(query);
        
        // Convert features từ chuỗi JSON (nếu DB lưu text) hoặc giữ nguyên nếu là JSONB
        // Lưu ý: pg tự động parse JSONB thành object
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get Plans Error:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách gói dịch vụ" });
    }
};

// Quản lý Gói dịch vụ (Thêm gói mới)
export const createPlan = async (req, res) => {
    const { plan_name, price, duration_days, features } = req.body;
    try {
        const query = `
            INSERT INTO subscription_plan (plan_name, price, duration_days, features)
            VALUES ($1, $2, $3, $4) RETURNING *
        `;
        const result = await db.query(query, [plan_name, price, duration_days, JSON.stringify(features)]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi tạo gói dịch vụ" });
    }
};

// Cập nhật gói
export const updatePlan = async (req, res) => {
    const { id } = req.params;
    const { plan_name, price, duration_days, features } = req.body;

    try {
        const query = `
            UPDATE subscription_plan
            SET plan_name = $1, price = $2, duration_days = $3, features = $4
            WHERE id = $5
            RETURNING *
        `;
        const result = await db.query(query, [plan_name, price, duration_days, JSON.stringify(features), id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Không tìm thấy gói dịch vụ" });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Update Plan Error:", error);
        res.status(500).json({ message: "Lỗi khi cập nhật gói dịch vụ" });
    }
};

// Xóa gói
export const deletePlan = async (req, res) => {
    const { id } = req.params;
    try {
        // Kiểm tra xem có user nào đang dùng gói này không (nếu cần kỹ hơn)
        // Ở đây xóa thẳng, nếu có ràng buộc khóa ngoại DB sẽ báo lỗi
        const query = 'DELETE FROM subscription_plan WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Không tìm thấy gói dịch vụ" });
        }

        res.status(200).json({ message: "Đã xóa gói dịch vụ thành công" });
    } catch (error) {
        console.error("Delete Plan Error:", error);
        // Lỗi thường gặp: Gói đang được sử dụng bởi user (Foreign Key Constraint)
        if (error.code === '23503') {
             return res.status(400).json({ message: "Không thể xóa gói đang có người sử dụng" });
        }
        res.status(500).json({ message: "Lỗi server khi xóa gói" });
    }
};

// CONTROLLER Quản lý config
// Lấy cấu hình hệ thống
export const getSystemConfig = async (req, res) => {
    try {
        // Luôn lấy dòng có id = 1
        const result = await db.query('SELECT * FROM system_config WHERE id = 1');
        
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            // Fallback nếu chưa có (dù đã init ở model)
            res.status(200).json({ 
                maintenance_mode: false, 
                support_email: '', 
                tax_vat_default: 8 
            });
        }
    } catch (error) {
        console.error("Get Config Error:", error);
        res.status(500).json({ message: "Lỗi lấy cấu hình" });
    }
};

// Cập nhật cấu hình hệ thống
export const updateSystemConfig = async (req, res) => {
    const { 
        maintenance_mode, 
        support_email, 
        ai_model_version, 
        tax_vat_default,
        max_upload_size_mb 
    } = req.body;

    try {
        const query = `
            UPDATE system_config
            SET maintenance_mode = $1,
                support_email = $2,
                ai_model_version = $3,
                tax_vat_default = $4,
                max_upload_size_mb = $5,
                updated_at = NOW()
            WHERE id = 1
            RETURNING *
        `;
        
        const values = [
            maintenance_mode, 
            support_email, 
            ai_model_version, 
            tax_vat_default,
            max_upload_size_mb
        ];

        const result = await db.query(query, values);
        
        res.status(200).json({ 
            message: "Đã lưu cấu hình hệ thống", 
            data: result.rows[0] 
        });

    } catch (error) {
        console.error("Update Config Error:", error);
        res.status(500).json({ message: "Lỗi khi lưu cấu hình" });
    }
};

// --- PHẦN MỚI THÊM VÀO: API THỐNG KÊ DASHBOARD (ĐỂ SỬA LỖI CRASH) ---

export const getDashboardStats = async (req, res) => {
    try {
        const revenueQuery = `
            SELECT SUM(sp.price) as total_revenue
            FROM users u
            JOIN subscription_plan sp ON u.plan_id = sp.id
            WHERE u.status = 'ACTIVE'
        `;
        const revenueResult = await db.query(revenueQuery);
        const totalRevenue = parseInt(revenueResult.rows[0]?.total_revenue) || 0;

        const ownersQuery = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active
            FROM users 
            WHERE role_id = (SELECT id FROM role WHERE role_name = 'OWNER')
        `;
        const ownersResult = await db.query(ownersQuery);
        
        const plansResult = await db.query('SELECT COUNT(*) FROM subscription_plan');

        res.status(200).json({
            totalRevenue: totalRevenue,
            totalOwners: parseInt(ownersResult.rows[0]?.total) || 0,
            activeOwners: parseInt(ownersResult.rows[0]?.active) || 0,
            totalPlans: parseInt(plansResult.rows[0]?.count) || 0
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Lỗi lấy thống kê dashboard" });
    }
};

export const getRevenueStats = async (req, res) => {
    // Dữ liệu giả lập
    const mockData = [
        { date: '2024-01-01', value: 1500000 },
        { date: '2024-01-02', value: 2300000 },
        { date: '2024-01-03', value: 1800000 },
        { date: '2024-01-04', value: 3200000 },
        { date: '2024-01-05', value: 2100000 },
        { date: '2024-01-06', value: 4500000 },
        { date: '2024-01-07', value: 3800000 },
    ];
    res.status(200).json(mockData);
};

export const getGrowthStats = async (req, res) => {
    // Dữ liệu giả lập
    const mockData = [
        { date: '2024-01-01', value: 5 },
        { date: '2024-01-02', value: 12 },
        { date: '2024-01-03', value: 18 },
        { date: '2024-01-04', value: 25 },
        { date: '2024-01-05', value: 30 },
        { date: '2024-01-06', value: 45 },
        { date: '2024-01-07', value: 50 },
    ];
    res.status(200).json(mockData);
};