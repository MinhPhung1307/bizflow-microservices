'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Phone, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Sử dụng hàm cn từ utils.ts của bạn
import { authService } from '@/services/auth.service';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    phone_number: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Xóa lỗi khi người dùng bắt đầu gõ lại
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    // GỌI QUA SERVICE (Không cần lo về URL nữa)
    const data = await authService.login(formData.phone_number, formData.password);

    // Xử lý Role (như cũ)
    let roleName = 'EMPLOYEE';
    if (data.role_id === 1 || data.role_id === '1') roleName = 'ADMIN';
    if (data.role_id === 2 || data.role_id === '2') roleName = 'OWNER';

    Cookies.set('token', 'true', { expires: 1 });
    Cookies.set('role', roleName, { expires: 1 });
    if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
      }
    localStorage.setItem('user', JSON.stringify(data));

    // Điều hướng
    if (roleName === 'ADMIN') router.push('/admin');
    else if (roleName === 'OWNER') router.push('/dashboard');
    else router.push('/pos');

    router.refresh();

  } catch (err: any) {
    // Lấy message lỗi từ axios response
    setError(err.response?.data?.message || 'Đăng nhập thất bại');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-blue-600 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4 backdrop-blur-sm">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">BizFlow</h1>
          <p className="text-blue-100">Đăng nhập để truy cập vào hệ thống</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Thông báo lỗi */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Input Số điện thoại */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block" htmlFor="phone_number">
                Số điện thoại
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="text"
                  required
                  placeholder="0912345678"
                  className={cn(
                    "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none",
                    "placeholder:text-gray-400 text-gray-900"
                  )}
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Input Mật khẩu */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block" htmlFor="password">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className={cn(
                    "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none",
                    "placeholder:text-gray-400 text-gray-900"
                  )}
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Nút đăng nhập */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                isLoading && "opacity-70 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Bạn là chủ cửa hàng mới?{' '}
                <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                  Đăng ký Owner
                </Link>
              </p>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}