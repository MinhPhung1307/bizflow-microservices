'use client';

import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function Header() {
  const handleLogout = async () => {
  // 1. XÓA NGAY LẬP TỨC (Không cần chờ API)
  if (typeof window !== 'undefined') {
      localStorage.removeItem('token'); // Xóa token
      localStorage.removeItem('role');  // Xóa role
      localStorage.removeItem('user_info'); // Xóa thông tin phụ (nếu có)
  }

  // 2. Gọi API để Backend xóa Cookie (Chạy ngầm, không cần await kết quả quá lâu)
  // Dùng .catch để dù lỗi mạng cũng không chặn việc chuyển trang
  authService.logout().catch(err => console.log("Logout API error:", err));

  // 3. ÉP CHUYỂN TRANG
  // Sử dụng setTimeout nhỏ để đảm bảo trình duyệt kịp xóa Storage trước khi reload
  setTimeout(() => {
      window.location.href = '/login'; 
  }, 100); 
};
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Xin chào, {JSON.parse(localStorage.getItem('user') || '{}')?.full_name}</span>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Đăng xuất" >
          <LogOut size={20} />
        </Button>
      </div>
    </header>
  );
}