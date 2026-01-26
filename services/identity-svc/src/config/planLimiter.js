import db from './db.js';

/**
 * Kiểm tra xem Owner đã đạt giới hạn số lượng nhân viên của gói dịch vụ chưa.
 * @param {string} ownerId - ID của chủ cửa hàng (UUID)
 * @returns {Promise<boolean>} - True nếu còn lượt, False nếu đã hết hoặc có lỗi.
 */
export const checkEmployeeLimit = async (ownerId) => {
    try {
        // 1. Truy vấn giới hạn từ gói dịch vụ (Subscription Plan)
        const planQuery = `
            SELECT p.features 
            FROM users u
            JOIN subscription_plan p ON u.plan_id = p.id
            WHERE u.id = $1
        `;
        const planResult = await db.query(planQuery, [ownerId]);
        
        if (planResult.rows.length === 0) return false;

        const features = planResult.rows[0].features;
        // Hỗ trợ cả cấu trúc features.limits.max_employees hoặc features.max_employees
        const limit = (features.limits ? features.limits.max_employees : features.max_employees) || 0;

        // 2. Nếu limit < 0 (ví dụ: -1), coi như không giới hạn (Unlimited)
        if (limit < 0) return true;

        // 3. Đếm số lượng nhân viên hiện tại (những user có owner_id là ownerId)
        const countRes = await db.query(
            'SELECT COUNT(*) FROM users WHERE owner_id = $1', 
            [ownerId]
        );
        const currentCount = parseInt(countRes.rows[0].count);

        // 4. So sánh: Cho phép nếu $currentCount < limit$
        console.log(`[Limit Check] Employee: ${currentCount} / ${limit}`);
        return currentCount < limit;

    } catch (error) {
        console.error("Critical Error in checkEmployeeLimit:", error);
        return false; // Chặn mặc định nếu hệ thống gặp sự cố
    }
};