// src/app/layout.tsx
import './globals.css';
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from '@/components/providers/QueryProvider'; // Import component vừa tạo

export const metadata = {
  title: 'BizFlow',
  description: 'Hệ thống quản lý hộ kinh doanh',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        {/* Bọc ứng dụng bằng QueryProvider */}
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}