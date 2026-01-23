'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
// Thêm icon Store hoặc Calculator
import { LayoutDashboard, Package, Users, FileBarChart, 
  ShoppingCart, Store, UserCog, History
} from 'lucide-react'; 
import { cn } from '@/lib/utils';

const sidebarItems = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  // ... các mục cũ
  { href: '/dashboard/inventory', label: 'Kho hàng', icon: Package },
  { href: '/dashboard/orders', label: 'Đơn hàng', icon: ShoppingCart },
  { href: '/dashboard/customers', label: 'Khách hàng', icon: Users },
  { href: '/dashboard/staff', label: 'Nhân viên', icon: UserCog },
  { href: '/dashboard/audit-logs', label: 'Nhật ký', icon: History },
  { href: '/dashboard/reports', label: 'Báo cáo', icon: FileBarChart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside className="w-64 bg-white border-r h-screen flex flex-col hidden md:flex">
      <div className="h-16 flex items-center justify-center border-b">
        <h1 className="text-2xl font-bold text-blue-600">BizFlow</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {/* NÚT POS NỔI BẬT: Đặt ở đầu hoặc tách riêng */}
        <Link
            href="/pos"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md mb-4 transition-all"
        >
            <Store size={20} />
            Bán hàng (POS)
        </Link>

        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = mounted && pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {/* ... */}
    </aside>
  );
}