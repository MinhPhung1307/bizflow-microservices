"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useUserStore } from "@/hooks/useUserStore";

// Icons
import { LogOut, User, Settings, Store, Bell, Search } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function Header() {
  const router = useRouter();
  // Sử dụng Store thay vì localStorage để dữ liệu luôn tươi mới
  const { user, fetchUser, loading, setUser } = useUserStore();

  useEffect(() => {
    // Chỉ fetch nếu chưa có user
    if (!user) {
      fetchUser();
    }
  }, [user, fetchUser]);

  const handleLogout = async () => {
    // 1. XÓA NGAY LẬP TỨC local storage (Logic cũ của bạn)
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user_info");
    }

    // Xóa user trong store
    setUser(null as any);

    // 2. Gọi API Logout
    authService.logout().catch((err) => console.log("Logout API error:", err));

    // 3. Chuyển hướng
    setTimeout(() => {
      window.location.href = "/login";
    }, 100);
  };

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
      {/* --- PHẦN TRÁI: SEARCH HOẶC TITLE --- */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-sm hidden md:block">
          {/* Giữ chỗ cho ô tìm kiếm nếu cần sau này */}
          <h2 className="text-lg font-semibold text-gray-800">
            Quản lý cửa hàng
          </h2>
        </div>
      </div>

      {/* --- PHẦN PHẢI: USER INFO & ACTIONS --- */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-gray-500">
          <Bell className="h-5 w-5" />
        </Button>

        {/* Dropdown Menu User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all">
                <AvatarImage
                  src={user?.avatar?.url || ""}
                  alt={user?.full_name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-blue-600 text-white font-bold">
                  {loading ? (
                    <Skeleton className="h-full w-full rounded-full" />
                  ) : (
                    user?.full_name?.charAt(0).toUpperCase() || "U"
                  )}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {loading ? "Đang tải..." : user?.full_name || "Người dùng"}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.shop_name || "Cửa hàng của bạn"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <Link href="/dashboard/profile">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Hồ sơ cá nhân</span>
                </DropdownMenuItem>
              </Link>

              <Link href="/pos">
                <DropdownMenuItem className="cursor-pointer">
                  <Store className="mr-2 h-4 w-4" />
                  <span>Bán hàng (POS)</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
