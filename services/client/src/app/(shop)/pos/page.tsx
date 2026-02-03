'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // [Mới] Import router
import ProductGrid from '@/components/features/pos/ProductGrid';
import CartSection from '@/components/features/pos/CartSection';
import AIOrderDialog from '@/components/features/pos/AIOrderDialog';
import { orderService } from '@/services/order.service';
import DraftOrderList from '@/components/features/pos/DraftOrderList';
import { productService } from '@/services/product.service';
import { useCart } from '@/hooks/useCart';
import { useUserStore } from '@/hooks/useUserStore'; // [Mới] Import user store
import { Button } from '@/components/ui/button'; // [Mới]
import { toast } from 'sonner';
import { FileText, ChevronLeft, LayoutDashboard } from 'lucide-react'; // [Mới] Icons

export default function POSPage() {
  const router = useRouter();
  const { user } = useUserStore(); // [Mới] Lấy thông tin user
  
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftOrders, setDraftOrders] = useState<any[]>([]); 
  
  const { addToCart, setCart, clearCart, items } = useCart(); 

  const fetchDrafts = async () => {
    try {
        const data = await orderService.getDrafts();
        setDraftOrders(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("Lỗi tải đơn nháp", error);
    }
  };

  useEffect(() => {
    if (isDraftModalOpen) fetchDrafts();
  }, [isDraftModalOpen]);

  // --- LOGIC 2: Lưu đơn nháp từ AI ---
  const handleSaveDraft = async (items: any[]) => {
    try {
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const payload = {
            customer_id: null,
            customer_name: 'Khách lẻ (AI Draft)',
            items: items.map(i => ({
                product_id: i.product_id,
                quantity: i.quantity,
                price: i.price,
                uom_id: null 
            })),
            payment_method: 'cash',
            total_price: total,
            status: 'DRAFT'
        };

        await orderService.createDraft(payload);
        toast.success("Đã lưu vào đơn nháp!");
        fetchDrafts();
    } catch (e) {
        toast.error("Lỗi khi lưu đơn nháp");
    }
  };

  // --- LOGIC 3: Chọn đơn nháp để bán ---
  const handleSelectDraft = async (draft: any) => {
    if (items.length > 0) {
        const confirm = window.confirm("Giỏ hàng hiện tại sẽ bị xóa để nạp đơn nháp. Bạn có chắc không?");
        if (!confirm) return;
    }

    try {
        const allProducts = await productService.getAll({ limit: 2000 });
        
        const cartItems = draft.items.map((i: any) => {
            const productInfo = allProducts.find((p: any) => p.id === i.product_id);
            
            return {
                id: i.product_id,
                name: productInfo ? productInfo.name : 'Sản phẩm (Đã xóa/Cũ)', 
                price: Number(i.price),
                quantity: Number(i.quantity),
                uom_name: productInfo ? (productInfo.unit || productInfo.uom_name) : 'Đơn vị',
                stock: productInfo ? (productInfo.stock || productInfo.stock_quantity || 999) : 0,
                image: productInfo?.image_url
            };
        });

        setCart(cartItems);
        
        await orderService.delete(draft.id);
        toast.success(`Đã nạp đơn #${draft.code || draft.id.toString().substring(0,6)} vào giỏ!`);
        setIsDraftModalOpen(false);
        
    } catch (e) {
        console.error(e);
        toast.error("Lỗi khi nạp đơn nháp");
    }
  };

  // --- LOGIC 4: Xóa đơn nháp ---
  const handleDeleteDraft = async (id: string) => {
    if(!window.confirm("Xóa vĩnh viễn đơn nháp này?")) return;
    try {
        await orderService.delete(id);
        toast.success("Đã xóa đơn nháp");
        fetchDrafts();
    } catch (e) {
        toast.error("Không xóa được");
    }
  };

  const handleAIAddToCart = (items: any[], customer: any) => {
    let count = 0;
    items.forEach(item => {
        if (item.product_id) { 
            addToCart({
                id: item.product_id,
                name: item.product_name,
                price_sales: item.price,
                stock: item.stock,
                uom_name: item.unit,
                quantity: item.quantity, 
                image: item.image,
                ...item
            });
            count++;
        }
    });

    if (customer) {
        toast.info(`AI đã chọn khách: ${customer.full_name}. Vui lòng chọn lại khách này trong giỏ hàng nếu cần ghi nợ.`);
    }
    
    if (count > 0) {
        toast.success(`Đã thêm ${count} sản phẩm vào giỏ!`);
    }
    setIsAIModalOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
          e.preventDefault();
          document.getElementById('product-search-input')?.focus();
      }
      if (e.key === 'F4') {
          e.preventDefault();
          document.getElementById('btn-pay-cash')?.click();
      }
      if (e.key === 'F8') {
          e.preventDefault();
          setIsAIModalOpen(true);
      }
      if (e.key === 'Escape') setIsAIModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden relative bg-slate-100">
      {/* CỘT TRÁI: SẢN PHẨM */}
      <div className="w-2/3 flex flex-col border-r relative">
        
        {/* [Mới] HEADER: Nút quay lại & Tiêu đề */}
        <div className="h-14 border-b bg-white flex items-center px-4 justify-between shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-2">
                {/* Chỉ hiện nút Dashboard nếu là OWNER */}
                {user?.role === 'OWNER' && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.push('/dashboard')} 
                        className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 -ml-2 mr-2"
                    >
                        <ChevronLeft size={18} />
                        <LayoutDashboard size={16} className="mr-1" />
                        Dashboard
                    </Button>
                )}
                <h1 className="font-bold text-lg text-slate-800">Bán hàng tại quầy</h1>
            </div>
        </div>

        {/* COMPONENT GRID */}
        <div className="flex-1 overflow-hidden">
            <ProductGrid />
        </div>
      </div>

      {/* CỘT PHẢI: GIỎ HÀNG */}
      <div className="w-1/3 bg-white shadow-xl z-10 border-l h-full">
        <CartSection />
      </div>

      {/* Footer Phím tắt */}
      <div className="fixed bottom-0 left-0 w-2/3 bg-white/90 backdrop-blur border-t px-4 py-1.5 text-xs text-slate-500 flex justify-between z-10">
         <div className="flex gap-4 font-mono items-center">
             <span><kbd className="bg-slate-100 border px-1 rounded font-bold">F2</kbd> Tìm SP</span>
             <span><kbd className="bg-slate-100 border px-1 rounded font-bold">F4</kbd> Thanh toán</span>
             
             <span 
                className="text-indigo-600 font-bold cursor-pointer hover:underline flex items-center gap-1"
                onClick={() => setIsAIModalOpen(true)}
             >
                <kbd className="bg-indigo-50 border border-indigo-200 px-1 rounded">F8</kbd> AI Voice
             </span>

             <div className="h-4 w-[1px] bg-slate-300 mx-2"></div>

             <span 
                className="text-orange-600 font-bold cursor-pointer hover:underline flex items-center gap-1"
                onClick={() => setIsDraftModalOpen(true)}
             >
                <FileText size={14} /> Đơn nháp ({draftOrders.length > 0 ? draftOrders.length : '0'})
             </span>
         </div>
      </div>

      <AIOrderDialog 
        open={isAIModalOpen} 
        onOpenChange={setIsAIModalOpen}
        onConfirm={handleAIAddToCart}
        onSaveDraft={handleSaveDraft}
      />

      <DraftOrderList 
        open={isDraftModalOpen}
        onOpenChange={setIsDraftModalOpen}
        drafts={draftOrders}
        onSelect={handleSelectDraft}
        onDelete={handleDeleteDraft}
      />
    </div>
  );
}