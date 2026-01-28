// services/client/src/services/user.service.ts
import axios from "@/lib/axios";
import { UserProfile } from "@/types";

export const userService = {
  // Lấy profile
  getProfile: async (): Promise<UserProfile> => {
    // SỬA: Gọi đúng đường dẫn mà Gateway đã định nghĩa (/users)
    const response = await axios.get("/users/profile");
    // Backend trả về: { success: true, data: ... }
    return response.data.data;
  },

  // Cập nhật profile
  updateProfile: async (data: {
    full_name: string;
    shop_name?: string;
    avatar?: string;
  }) => {
    // Nếu có avatar (URL string), chuyển thành object để khớp với backend JSONB
    const payload = {
      ...data,
      avatar: data.avatar ? { url: data.avatar } : undefined,
    };

    // SỬA: Gọi đúng đường dẫn mà Gateway đã định nghĩa (/users)
    const response = await axios.put("/users/profile", payload);
    return response.data;
  },
};