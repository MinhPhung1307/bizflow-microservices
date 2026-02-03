'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { useCart } from '@/hooks/useCart';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // [Mới] Dùng Skeleton cho đẹp

export default function ProductGrid() {
  const [search, setSearch] = useState('');
  const addToCart = useCart((state) => state.addToCart);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productService.getAll({ search, limit: 100 }), // Lấy nhiều hơn vì thẻ nhỏ
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const products = Array.isArray(data) ? data : [];

  // Hàm handle click để thêm vào giỏ
  const handleAddToCart = (product: any) => {
    if (product.stock_quantity <= 0) return; // Chặn nếu hết hàng
    addToCart(product);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 p-4">
      {/* Ô TÌM KIẾM */}
      <div className="relative mb-4 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
        <Input 
          id="product-search-input"
          placeholder="Tìm tên sản phẩm, mã vạch (F2)..." 
          className="pl-10 h-12 text-lg shadow-sm border-slate-300 bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* DANH SÁCH SẢN PHẨM */}
      <div className="flex-1 overflow-y-auto pb-20 pr-1">
        {isLoading ? (
            // Skeleton Loading
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border p-3 h-32 flex flex-col justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                        <div className="flex justify-between items-end">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-6 w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        ) : products.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-10 text-slate-400 h-full">
                <Package size={48} className="mb-2 opacity-20" />
                <p>{isError ? 'Có lỗi xảy ra.' : 'Không tìm thấy sản phẩm nào'}</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product: any) => {
                const isOutOfStock = product.stock_quantity <= 0;
                const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

                return (
                  <div 
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className={`
                      relative group cursor-pointer flex flex-col justify-between
                      bg-white rounded-lg border shadow-sm transition-all duration-200
                      hover:shadow-md hover:border-indigo-300 active:scale-95
                      p-3 h-32 select-none
                      ${isOutOfStock ? 'opacity-60 bg-slate-50 grayscale' : ''}
                    `}
                  >
                    {/* Dải màu trạng thái bên trái */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${isOutOfStock ? 'bg-slate-300' : 'bg-indigo-500'}`}></div>

                    {/* Phần trên: Tên & Mã */}
                    <div className="pl-2 pr-1">
                        <h3 className="font-semibold text-slate-800 line-clamp-2 leading-tight text-sm md:text-base mb-1" title={product.name}>
                            {product.name}
                        </h3>
                        {/* Nếu có mã code thì hiện, không thì ẩn */}
                        {product.code && <p className="text-[10px] text-slate-400 font-mono">#{product.code}</p>}
                    </div>

                    {/* Phần dưới: Giá & Tồn kho */}
                    <div className="pl-2 pr-1 flex items-end justify-between mt-auto">
                        <div>
                            <div className="text-indigo-700 font-bold text-lg leading-none">
                                {new Intl.NumberFormat('vi-VN').format(product.price || product.price_sales || 0)}
                                <span className="text-xs font-normal text-slate-500 ml-0.5">đ</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                                Đơn vị: {product.unit || 'Cái'}
                            </div>
                        </div>

                        {/* Badge Tồn kho */}
                        <div className="text-right">
                            {isOutOfStock ? (
                                 <Badge variant="destructive" className="px-1.5 py-0 h-5 text-[10px]">Hết hàng</Badge>
                            ) : (
                                 <div className={`text-xs font-medium flex items-center gap-1 ${isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                                    <Package size={12} />
                                    <span>{product.stock_quantity}</span>
                                 </div>
                            )}
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
        )}
      </div>
    </div>
  );
}