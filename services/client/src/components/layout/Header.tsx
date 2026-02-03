"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useUserStore } from "@/hooks/useUserStore";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { ownerService } from "@/services/owner.service"; 

// Icons
import { LogOut, User, Settings, Store, Bell, Search, CheckCircle2, MessageSquare } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    // Chỉ fetch nếu chưa có user trong store
    if (!user) {
      fetchUser();
    }
  }, [user, fetchUser]);
  
  const [lastReadTime, setLastReadTime] = useState(0);

  useEffect(() => {
    if (!user) fetchUser();
    
    // Lấy thời gian đọc cuối cùng từ LocalStorage
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('notification_last_read');
        setLastReadTime(stored ? parseInt(stored) : 0);
    }
  }, [user, fetchUser]);

  // Query lấy danh sách Feedback
  const { data: feedbacks = [] } = useQuery({
    queryKey: ['my-feedbacks'],
    queryFn: ownerService.getMyFeedbacks,
    refetchInterval: 30000, // Tự động check mỗi 30s
    enabled: !!user // Chỉ chạy khi đã login
  });

  // Xử lý dữ liệu thông báo
  // Chỉ lấy những feedback đã được Admin xử lý (PROCESSED)
  const notifications = feedbacks
    .filter((f: any) => f.status === 'PROCESSED')
    .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // Đếm số thông báo mới (có thời gian update > lần cuối xem)
  const unreadCount = notifications.filter((f: any) => new Date(f.updated_at).getTime() > lastReadTime).length;

  const handleOpenNotification = (open: boolean) => {
      if (open) {
          // Khi mở menu, đánh dấu là đã đọc tất cả
          const now = Date.now();
          setLastReadTime(now);
          localStorage.setItem('notification_last_read', now.toString());
      }
  }


  const handleLogout = async () => {
    // 1. XÓA NGAY LẬP TỨC local storage
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user_info");
    }

    // Xóa user trong store
    setUser(null as any);

    // 2. Gọi API Logout (chạy ngầm)
    authService.logout().catch((err) => console.log("Logout API error:", err));

    // 3. Chuyển hướng về trang login
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
        <DropdownMenu onOpenChange={handleOpenNotification}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-gray-500">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="flex justify-between items-center">
                    Thông báo
                    {unreadCount > 0 && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{unreadCount} mới</Badge>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                            <Bell className="h-8 w-8 opacity-20" />
                            <p>Chưa có thông báo nào</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notif: any) => {
                                const isUnread = new Date(notif.updated_at).getTime() > lastReadTime;
                                return (
                                    <DropdownMenuItem key={notif.id} className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${isUnread ? 'bg-blue-50' : ''}`}>
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-semibold text-sm line-clamp-1 flex items-center gap-2">
                                                <MessageSquare size={14} className="text-blue-600" />
                                                {notif.title}
                                            </span>
                                            {isUnread && <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />}
                                        </div>
                                        <div className="text-xs text-gray-600 line-clamp-2 bg-white/50 p-1.5 rounded w-full border border-dashed">
                                            <span className="font-bold text-blue-700">Admin: </span> 
                                            {notif.admin_note || "Đã xử lý yêu cầu của bạn."}
                                        </div>
                                        <span className="text-[10px] text-gray-400 self-end">
                                            {format(new Date(notif.updated_at), "HH:mm dd/MM")}
                                        </span>
                                    </DropdownMenuItem>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>

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