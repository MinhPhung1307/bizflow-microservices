'use client';

import React, { useState } from 'react';
import { Search, Package, Plus, ShoppingCart, Minus, Trash2, Users, Printer, X, LogOut } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import { PRODUCTS } from '@/lib/constants';
import { formatCurrency, cn } from '@/lib/utils';

interface POSProps {
  addToCart: (product: any) => void;
  cart: any[];
  updateQuantity: (id: number, delta: number) => void;
  removeFromCart: (id: number) => void;
  checkout: (isDebt: boolean) => void;
  isMobile: boolean;
}

export const POS = ({ addToCart, cart, updateQuantity, removeFromCart, checkout, isMobile }: POSProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const filteredProducts = PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (selectedCategory === 'All' || p.category === selectedCategory)
  );

  const router = useRouter();

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống POS?')) {
      await authService.logout();
      router.push('/login'); // Chuyển hướng về trang đăng nhập
    }
  };

  const categories = ['All', ...Array.from(new Set(PRODUCTS.map(p => p.category)))];
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden relative">
      <div className="flex-1 flex flex-col h-full bg-slate-50">
        <div className="p-4 bg-white border-b border-slate-200 shadow-sm z-10">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-2 items-center">
                    <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide flex-1">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors border",
                                    selectedCategory === cat 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                )}
                            >
                                {cat === 'All' ? 'Tất cả' : cat}
                            </button>
                        ))}
                    </div>

                    {/* NÚT ĐĂNG XUẤT */}
                    <button 
                        onClick={handleLogout}
                        className="p-2.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center shrink-0"
                        title="Đăng xuất"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.map(product => (
                <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all active:scale-95 flex flex-col h-full"
                >
                <div className="aspect-square bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-300 relative overflow-hidden group">
                    <Package size={40} className="group-hover:scale-110 transition-transform" />
                    {product.stock < 10 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Sắp hết</span>
                    )}
                </div>
                <h4 className="font-semibold text-slate-800 text-sm sm:text-base line-clamp-2 mb-auto" title={product.name}>{product.name}</h4>
                <div className="mt-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                         <span>{product.unit}</span>
                         <span>Kho: {product.stock}</span>
                    </div>
                    <div className="flex justify-between items-center">
                         <p className="font-bold text-blue-600 text-sm sm:text-base">{formatCurrency(product.price)}</p>
                         <button className="bg-blue-50 p-1.5 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                            <Plus size={16} />
                         </button>
                    </div>
                </div>
                </div>
            ))}
            </div>
        </div>
      </div>

      {isMobile && cart.length > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-30">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-blue-600 text-white p-4 rounded-xl shadow-xl shadow-blue-200 flex justify-between items-center animate-bounce-slow"
              >
                  <div className="flex items-center gap-2">
                      <div className="bg-white/20 px-2 py-0.5 rounded text-sm font-bold">{cartItemCount}</div>
                      <span className="font-bold">Xem đơn hàng</span>
                  </div>
                  <span className="font-bold text-lg">{formatCurrency(cartTotal)}</span>
              </button>
          </div>
      )}

      <div className={cn(
            "fixed inset-y-0 right-0 z-40 w-full md:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:w-96 lg:shadow-none lg:border-l lg:border-slate-200 lg:flex lg:flex-col",
            isMobile ? (isCartOpen ? 'translate-x-0' : 'translate-x-full') : ''
      )}>
        {isMobile && (
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
                <span className="font-bold flex items-center gap-2"><ShoppingCart size={20} /> Giỏ hàng</span>
                <button onClick={() => setIsCartOpen(false)}><X size={24} /></button>
            </div>
        )}

        <div className="hidden lg:flex p-4 border-b border-slate-200 bg-white justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
            <ShoppingCart size={20} className="text-blue-600" /> Đơn hàng
          </h3>
          <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">{cartItemCount} SP</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <ShoppingCart size={48} className="mb-3 opacity-20" />
              <p>Chưa có sản phẩm nào</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex gap-3 animate-slide-in">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-400">
                    <Package size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h4 className="font-medium text-slate-800 text-sm line-clamp-2 leading-tight mb-1">{item.name}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                    <div className="flex justify-between items-end">
                        <p className="text-sm text-blue-600 font-bold">{formatCurrency(item.price)}</p>
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                            <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }} className="p-1 hover:bg-slate-100 text-slate-600 rounded-l-lg">
                                <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                            <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }} className="p-1 hover:bg-slate-100 text-slate-600 rounded-r-lg">
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 z-20">
           <div className="space-y-2 mb-4">
             <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-dashed border-slate-200">
                 <span>Tổng tiền</span>
                 <span className="text-blue-600">{formatCurrency(cartTotal)}</span>
             </div>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={() => checkout(true)}
                className="py-3 px-4 bg-orange-50 text-orange-700 font-bold rounded-xl border border-orange-200 hover:bg-orange-100 flex flex-col items-center justify-center gap-1"
                disabled={cart.length === 0}
             >
               <span className="flex items-center gap-2"><Users size={18} /> Ghi nợ</span>
             </button>
             <button 
                onClick={() => checkout(false)}
                className="py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 flex flex-col items-center justify-center gap-1"
                disabled={cart.length === 0}
             >
               <span className="flex items-center gap-2"><Printer size={18} /> Thanh toán</span>
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};