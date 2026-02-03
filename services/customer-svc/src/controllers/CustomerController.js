import database from '../config/db.js';

// 1. Lấy danh sách khách hàng
export const getCustomers = async (req, res) => {
    try {
        const owner_id = req.user.ownerId || req.user.userId;
        const { search } = req.query;

        // SQL: Sửa tên bảng thành 'customer' (số ít)
        let query = `
            SELECT * FROM customer 
            WHERE owner_id = $1 
            ORDER BY created_at DESC
        `;
        let params = [owner_id];

        if (search && search.trim() !== '') {
            query = `
                SELECT * FROM customer 
                WHERE owner_id = $1 
                AND (full_name ILIKE $2 OR phone_number ILIKE $2)
                ORDER BY created_at DESC
            `;
            params.push(`%${search}%`);
        }

        const result = await database.query(query, params);

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error("Get Customers Error:", error);
        res.status(500).json({ success: false, message: "Lỗi server khi tải danh sách" });
    }
};

// 2. Tạo khách hàng mới
export const createCustomer = async (req, res) => {
    try {
        const owner_id = req.user.ownerId || req.user.userId;
        // Frontend gửi lên full_name, ta map nó vào biến này
        const { full_name, phone_number, address } = req.body;

        if (!full_name || !phone_number) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập tên và SĐT" });
        }

        // Kiểm tra trùng SĐT trong bảng 'customer'
        const checkExist = await database.query(
            `SELECT id FROM customer WHERE phone_number = $1 AND owner_id = $2`,
            [phone_number, owner_id]
        );
        if (checkExist.rows.length > 0) {
            return res.status(400).json({ success: false, message: "SĐT này đã tồn tại" });
        }

        // INSERT vào bảng 'customer', cột 'name' và 'total_outstanding_debt'
        const query = `
            INSERT INTO customer (owner_id, full_name, phone_number, address, total_outstanding_debt, created_at)
            VALUES ($1, $2, $3, $4, 0, NOW())
            RETURNING *
        `;
        
        // Truyền full_name vào cột name
        const result = await database.query(query, [owner_id, full_name, phone_number, address || '']);

        res.status(201).json({
            success: true,
            message: "Thêm khách hàng thành công",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Create Customer Error:", error);
        res.status(500).json({ success: false, message: "Lỗi khi tạo khách hàng" });
    }
};

// 3. Cập nhật khách hàng
export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const owner_id = req.user.ownerId || req.user.userId;
        const { full_name, phone_number, address } = req.body;

        // UPDATE bảng 'customer'
        const query = `
            UPDATE customer 
            SET full_name = $1, phone_number = $2, address = $3
            WHERE id = $4 AND owner_id = $5
            RETURNING *
        `;
        const result = await database.query(query, [full_name, phone_number, address, id, owner_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
        }

        res.status(200).json({
            success: true,
            message: "Cập nhật thành công",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Update Customer Error:", error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật khách hàng" });
    }
};