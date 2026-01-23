// src/app/login/layout.tsx

export const metadata = {
  title: 'Đăng nhập - BizFlow',
  description: 'Đăng nhập hệ thống',
};

// BẮT BUỘC PHẢI CÓ: export default function
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {/* Render trang login con bên trong */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}