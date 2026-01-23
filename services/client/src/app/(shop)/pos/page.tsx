'use client';

import ProductGrid from '@/components/features/pos/ProductGrid';
import CartSection from '@/components/features/pos/CartSection';

export default function POSPage() {
  return (
    // Sử dụng h-screen trừ đi header (nếu có) hoặc full screen
    // Ở layout POS, thường ta sẽ ẩn Sidebar chính đi để rộng chỗ
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <ProductGrid />
      <CartSection />
    </div>
  );
}