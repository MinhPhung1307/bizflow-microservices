'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  // Trang này chỉ xuất hiện trong tích tắc trước khi Middleware redirect đi nơi khác.
  // Ta chỉ hiển thị loading để trải nghiệm người dùng mượt mà hơn.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium animate-pulse">Đang tải dữ liệu...</p>
      </div>
    </div>
  );
}