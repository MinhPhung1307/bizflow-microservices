import api from '@/lib/axios';

const clearAllCookies = () => {
  if (typeof document === 'undefined') return;
  
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      
      // Xóa cookie ở path root và path hiện tại
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
};

export const authService = {
  
  // Đăng ký Owner
  registerOwner: async (registerData: any) => {
    const response = await api.post('/user/sign-up', registerData);
    return response.data;
  },

  // 1. Đổi tham số thành phone_number
  login: async (phone_number: string, password: string) => {
    // 2. Gửi key là 'phone_number' (không phải email)
    // Lưu ý: Endpoint của bạn là /user/login hay /users/login tùy vào file routes.js
    // Dựa vào log lỗi của bạn thì là /api/user/login
    const response = await api.post('/user/login', { 
        phone_number, 
        password 
    });
    
    return response.data; 
  },
  
  logout: async () => {
    try {
      // 1. Gọi Backend xóa HttpOnly Cookie
      await api.post('/user/logout');
    } catch (error) {
      console.error("Lỗi API logout:", error);
    } finally {
      // 2. Xóa LocalStorage
      if (typeof window !== 'undefined') {
        localStorage.clear(); // Xóa sạch tất cả
      }

      // 3. Xóa Cookie phía Client (xử lý 'role' và 'token' nếu không phải HttpOnly)
      clearAllCookies();
    }
  },
};