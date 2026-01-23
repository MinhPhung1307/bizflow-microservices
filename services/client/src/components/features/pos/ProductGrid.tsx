'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { useCartStore } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/utils';
import { Search, Loader2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function ProductGrid() {
  const addToCart = useCartStore((state) => state.addToCart);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Gọi API lấy danh sách sản phẩm
  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getAll,
  });

  // 2. Logic lọc sản phẩm (Client-side filtering cho nhanh)
  const filteredProducts = products.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) || 
      (p.code && p.code.includes(searchLower))
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 p-4">
      {/* Header & Search */}
      <div className="mb-4 flex gap-2 items-center">
        <Link href="/dashboard" className="p-2 bg-white border rounded hover:bg-gray-100" title="Về trang chủ">
             <ArrowLeft size={20} className="text-gray-600"/>
        </Link>
        <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
                placeholder="Tìm tên sản phẩm, mã vạch..." 
                className="pl-9 bg-white shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus // Tự động focus để dùng máy quét mã vạch
            />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex-1 flex items-center justify-center text-red-500">
          Không thể tải danh sách sản phẩm. Vui lòng thử lại.
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredProducts.length === 0 && (
         <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <p>Không tìm thấy sản phẩm nào.</p>
         </div>
      )}

      {/* Product List */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pb-20 content-start">
        {filteredProducts.map((product) => (
          <div 
            key={product.id}
            onClick={() => addToCart(product)}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all active:scale-95 flex flex-col justify-between h-32 select-none"
          >
            <h3 className="font-semibold text-slate-800 text-sm line-clamp-2">{product.name}</h3>
            <div>
                <p className="text-blue-600 font-bold">{formatCurrency(product.price)}</p>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
                   <span>ĐVT: {product.unit}</span>
                   <span>Tồn: {product.stock}</span>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}