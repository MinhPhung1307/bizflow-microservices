'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, User, Store, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner'; // Giả định bạn dùng sonner như trong file list

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    shop_name: '',
    phone_number: '',
    password: '',
    confirm_password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      await authService.registerOwner({
        username: formData.phone_number,
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        password: formData.password,
        shop_name: formData.shop_name
      });
      
      toast.success('Đăng ký tài khoản Owner thành công!');
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Đăng ký BizFlow</h1>
          <p className="text-blue-100 text-sm">Dành cho Chủ hộ kinh doanh</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Họ và tên */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input name="full_name" type="text" required placeholder="Nguyễn Văn A" 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={handleChange} />
              </div>
            </div>

            {/* Tên cửa hàng */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Tên hộ kinh doanh</label>
              <div className="relative">
                <Store className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input name="shop_name" type="text" required placeholder="Vật liệu xây dựng BizFlow" 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={handleChange} />
              </div>
            </div>

            {/* Số điện thoại */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input name="phone_number" type="text" required placeholder="0912345678" 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={handleChange} />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
                <input name="password" type="password" required placeholder="••••••••" 
                  className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Xác nhận</label>
                <input name="confirm_password" type="password" required placeholder="••••••••" 
                  className="w-full px-4 py-2 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={handleChange} />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">
              {isLoading ? <Loader2 className="animate-spin" /> : "Đăng ký ngay"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}