'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileBarChart, 
  CreditCard, 
  LogOut,
  MessageSquare 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { adminService } from '@/services/admin.service';

export const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  // Lấy số lượng phản hồi chưa xử lý
  const { data: feedbackData } = useQuery({
    queryKey: ['admin', 'feedback-count'],
    queryFn: () => adminService.getPendingFeedbackCount(),
    refetchInterval: 30000, // Tự động làm mới mỗi 30 giây
  });

  const menuItems = [
    { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
    { href: '/admin/account-owner', label: 'Quản lý Chủ shop', icon: Users },
    { href: '/admin/subscription-plans', label: 'Gói dịch vụ', icon: CreditCard },
    { 
      href: '/admin/feedbacks', 
      label: 'Phản hồi', 
      icon: MessageSquare,
      badge: feedbackData?.count > 0 ? feedbackData.count : null
    },
    { href: '/admin/reports-analytics', label: 'Báo cáo & Phân tích', icon: FileBarChart },
    { href: '/admin/system-config', label: 'Cấu hình hệ thống', icon: Settings },
  ];

  const handleLogout = async () => {
      await authService.logout();
      router.push('/login');
  };

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 z-50">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700">
        <div className="font-bold text-xl tracking-wider text-blue-400">BizFlow Admin</div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-white"} />
              <span className="font-medium text-sm">{item.label}</span>
              {item.badge && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white group-hover:animate-pulse">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-700">
        <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};