'use client';

import React from 'react';
import ProductGrid from '@/components/features/pos/ProductGrid';
import CartSection from '@/components/features/pos/CartSection';

export default function POSPage() {
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Cột trái: Danh sách sản phẩm (66%) */}
      <div className="w-2/3 border-r">
        <ProductGrid />
      </div>

      {/* Cột phải: Giỏ hàng & Thanh toán (33%) */}
      <div className="w-1/3">
        <CartSection />
      </div>
    </div>
  );
}