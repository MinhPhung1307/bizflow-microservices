'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { useCart } from '@/hooks/useCart';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package } from 'lucide-react';

export default function ProductGrid() {
  const [search, setSearch] = useState('');
  const addToCart = useCart((state) => state.addToCart);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productService.getAll({ search }),
    // --- THÊM CẤU HÌNH NÀY ---
    staleTime: 1000 * 60, // Giữ data trong 1 phút, tránh fetch lại liên tục
    refetchOnWindowFocus: false, // Tắt tự động fetch khi switch tab (tránh lỗi nháy)
    // -------------------------
  });

  // Xử lý dữ liệu an toàn
  const products = Array.isArray(data) ? data : [];

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-4 gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm kiếm sản phẩm..."
          className="pl-10 h-10 bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Chỉ hiện loading khi KHÔNG có dữ liệu cũ */}
        {isLoading && products.length === 0 ? (
          <div className="text-center py-10">Đang tải sản phẩm...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            {isError ? 'Có lỗi xảy ra.' : (search ? 'Không tìm thấy sản phẩm nào.' : 'Chưa có sản phẩm.')}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product: any) => (
              <Card 
                // Key an toàn tuyệt đối
                key={String(product.id)} 
                className="cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                  <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                     {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                     ) : null}
                     <Package className={`h-8 w-8 text-gray-400 ${product.image_url ? 'hidden' : ''}`} />
                  </div>
                  
                  <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{product.uom_name}</Badge>
                    {product.stock_quantity <= 0 && <Badge variant="destructive" className="text-xs">Hết hàng</Badge>}
                  </div>
                </CardContent>
                <CardFooter className="p-3 bg-slate-50 border-t flex justify-center">
                  <span className="font-bold text-primary">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price_sales || 0)}
                  </span>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}