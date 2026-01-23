'use client';

import { useState } from 'react';
import { useCartStore } from '@/hooks/useCart';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2, Minus, Plus, User, Loader2 } from 'lucide-react';
import { orderService } from '@/services/order.service';
import { CreateOrderPayload } from '@/types';

export default function CartSection() {
  const { cart, removeFromCart, updateQuantity, totalAmount, clearCart } = useCartStore();
  const total = totalAmount();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Setup Mutation

  const createOrderMutation = useMutation({
    mutationFn: orderService.create,
    onSuccess: () => {
      alert('Thanh toán thành công!');
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error("Lỗi thanh toán:", error);
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  });

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const total = totalAmount();

    // CHUẨN BỊ PAYLOAD KHỚP DATABASE
    const payload: CreateOrderPayload = {
      customer_id: null,           // TODO: Sau này làm chức năng chọn khách thì điền ID vào
      customer_name: 'Khách lẻ',   // Tên mặc định
      order_type: 'AT_COUNTER',    // Bán tại quầy
      payment_method: 'CASH',      // Mặc định tiền mặt
      status: 'COMPLETED',         // Thanh toán xong thì hoàn thành luôn
      is_debt: false,              // Không nợ
      total_price: total,
      tax_price: 0,                // Tạm thời chưa tính thuế
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }))
    };

    createOrderMutation.mutate(payload);
  };

  return (
    <div className="w-[350px] md:w-[400px] bg-white border-l h-full flex flex-col shadow-xl z-20">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-white">
        <h2 className="font-bold text-lg">Đơn hàng</h2>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={clearCart}>
          <Trash2 size={16} /> <span className="ml-1">Xóa</span>
        </Button>
      </div>

      {/* Chọn khách hàng */}
      <div className="p-3 border-b bg-blue-50">
          <Button variant="ghost" className="w-full justify-start text-blue-700 hover:bg-blue-100">
             <User size={18} className="mr-2" />
             Khách lẻ (Chọn khách hàng)
          </Button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <p>Giỏ hàng trống</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="flex flex-col pb-3 border-b border-dashed last:border-0 gap-2">
              <div className="flex justify-between">
                 <span className="font-medium text-sm text-slate-800 line-clamp-1">{item.name}</span>
                 <span className="font-bold text-sm">{formatCurrency(item.price * item.quantity)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 text-xs">{formatCurrency(item.price)}</span>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-blue-600"
                    >
                        <Minus size={12} />
                    </button>
                    <span className="font-semibold text-xs min-w-[20px] text-center">{item.quantity}</span>
                    <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-blue-600"
                    >
                        <Plus size={12} />
                    </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Thanh toán */}
      <div className="p-4 bg-slate-50 border-t space-y-3">
        <div className="flex justify-between text-xl font-bold text-blue-700">
          <span>Tổng thu</span>
          <span>{formatCurrency(total)}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-2">
             <Button variant="outline" className="w-full border-blue-200 text-blue-700">
                In phiếu
             </Button>
             <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                size="lg"
                disabled={cart.length === 0 || createOrderMutation.isPending}
                onClick={handleCheckout}
            >
                {createOrderMutation.isPending ? <Loader2 className="animate-spin" /> : 'Thanh toán'}
             </Button>
        </div>
      </div>
    </div>
  );
}