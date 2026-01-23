import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'POS Bán hàng - BizFlow',
  description: 'Giao diện bán hàng cho nhân viên',
};

// BẮT BUỘC PHẢI CÓ: export default function
export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-full bg-slate-50 overflow-hidden">
      {/* Chỉ render nội dung POS, không có Sidebar */}
      {children}
    </div>
  );
}