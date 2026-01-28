// services/identity-svc/src/controllers/UserController.js
import db from "../config/db.js";

// Lấy thông tin profile
export const getProfile = async (req, res) => {
  try {
    // Lấy ID từ req.user (do middleware verifyToken gán vào)
    const userId = req.user.id;

    // Query lấy thông tin (không lấy password)
    const result = await db.query(
      `SELECT id, full_name, shop_name, phone_number, avatar, role_id, status 
             FROM "users" WHERE id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Trả về data
    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Cập nhật profile
export const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { full_name, shop_name, avatar } = req.body;

  // Xử lý avatar: Backend mong đợi JSONB hoặc String.
  // Nếu client gửi string URL, ta gói nó lại thành object json để lưu vào cột avatar (JSONB) cho nhất quán,
  // hoặc lưu thẳng string nếu cột DB của bạn là TEXT.
  // Ở đây giả định cột avatar là JSONB như file User.js bạn gửi ban đầu.

  let avatarJson = null;
  if (avatar) {
    // Nếu client gửi string "https://...", ta chuyển thành { url: "..." }
    // Nếu client đã gửi object, ta giữ nguyên
    avatarJson = typeof avatar === "string" ? { url: avatar } : avatar;
  }

  try {
    // COALESCE giúp giữ nguyên giá trị cũ nếu dữ liệu gửi lên là null/undefined
    const result = await db.query(
      `UPDATE "users" 
             SET full_name = COALESCE($1, full_name),
                 shop_name = COALESCE($2, shop_name),
                 avatar = COALESCE($3, avatar),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING id, full_name, shop_name, avatar, phone_number, status`,
      [full_name, shop_name, avatarJson, userId],
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật hồ sơ thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
