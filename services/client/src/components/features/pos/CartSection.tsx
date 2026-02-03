'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '@/hooks/useCart';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { orderService } from '@/services/order.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, User, CreditCard, Banknote, Search, Plus, Package, FileText, Save } from 'lucide-react'; 
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface CartSectionProps {
    selectedCustomer: any;
    onCustomerSelect: (cus: any) => void;
}

export default function CartSection() {
  const { items, removeFromCart, updateQuantity, clearCart } = useCart();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);

  const cartTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

  // --- QUERY: Tìm kiếm khách hàng ---
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', customerSearch],
    queryFn: () => customerService.getCustomers(customerSearch),
    enabled: isCustomerModalOpen,
  });

  const createCustomerMutation = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: (response: any) => {
        // 1. Refresh lại cache
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        
        // 2. Tự động chọn khách hàng vừa tạo
        const createdCustomer = response.data || response;
        setSelectedCustomer(createdCustomer);
        
        // 3. Đóng các Modal
        setIsCreateCustomerOpen(false);
        setIsCustomerModalOpen(false);
        
        toast.success(`Đã thêm khách hàng: ${createdCustomer.full_name}`);
    },
    onError: () => toast.error('Lỗi khi thêm khách hàng')
  });

  // Hàm xử lý submit form tạo khách hàng
  const handleCreateCustomerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createCustomerMutation.mutate({
      full_name: formData.get('full_name') as string,
      phone_number: formData.get('phone_number') as string,
      address: formData.get('address') as string,
    });
  };

  // --- FUNCTION: Xử lý in hóa đơn ---
  const handlePrintInvoice = (orderData: any) => {
    // Cách đơn giản nhất: Mở một trang in riêng hoặc dùng window.print
    // Trong thực tế, bạn nên gọi API lấy HTML hóa đơn rồi in
    
    // Demo in nhanh nội dung hiện tại
    toast.info("🖨️ Đang gửi lệnh in...");
    
    const printContent = `
      <html>
        <head><title>Hóa đơn #${orderData.id}</title></head>
        <body style="font-family: monospace; padding: 20px;">
          <h2 style="text-align: center">CỬA HÀNG BIZFLOW</h2>
          <p>Mã đơn: ${orderData.id}</p>
          <p>Ngày: ${new Date().toLocaleString('vi-VN')}</p>
          <hr/>
          ${items.map(item => `
            <div style="display: flex; justify-content: space-between;">
              <span>${item.name} (x${item.quantity})</span>
              <span>${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          `).join('')}
          <hr/>
          <h3 style="text-align: right">Tổng: ${cartTotal.toLocaleString()} đ</h3>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=600,height=600');
    if(printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }
  };

  // --- MUTATION: Tạo đơn hàng ---
  const createOrderMutation = useMutation({
    mutationFn: orderService.create,
    onSuccess: (data, variables) => {
        // Nếu là lưu nháp
        if (variables.status === 'draft') {
             toast.success('Đã lưu đơn nháp thành công!');
        } else {
             toast.success('Thanh toán thành công!', { description: `Mã đơn: ${data.id}` });
             handlePrintInvoice(data);
        }
        
        queryClient.resetQueries({ queryKey: ['products'] });
        clearCart();
        setSelectedCustomer(null);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      toast.error('Lỗi', { description: error.response?.data?.message || 'Có lỗi xảy ra' });
    }
  });

  const handleCheckout = (paymentMethod: 'cash' | 'transfer' | 'debt') => {
    if (items.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }

    if (paymentMethod === 'debt') {
        if (!selectedCustomer) {
            toast.error('Cảnh báo nợ xấu!', { 
                description: 'Vui lòng chọn khách hàng cụ thể để ghi nợ.' 
            });
            // Mở modal tìm khách hàng ngay lập tức để tiện cho user
            setIsCustomerModalOpen(true);
            return;
        }
        
        // (Optional) Kiểm tra hạn mức nợ nếu có field credit_limit
        // if (selectedCustomer.total_debt + total() > selectedCustomer.credit_limit) { ... }
    }

    const currentTotal = cartTotal;

    const payload = {
      customer_id: selectedCustomer?.id || null,
      customer_name: selectedCustomer?.full_name || 'Khách lẻ',
      items: items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        uom_id: item.uom_id || null,
        price: item.price
      })),
      payment_method: paymentMethod,
      notes: "Đơn hàng từ POS",
      
      // Các trường bắt buộc theo TypeScript Type
      order_type: 'AT_COUNTER', // Loại đơn tại quầy
      status: 'completed',      // Trạng thái hoàn thành ngay
      is_debt: paymentMethod === 'debt', // Có nợ hay không
      total_price: currentTotal,
      tax_price: 0,            // Tạm thời để 0
      amount_paid: paymentMethod === 'debt' ? 0 : currentTotal // Nếu nợ thì trả 0, còn lại trả đủ
    };

    // @ts-ignore - Bỏ qua check type nếu còn sót field nhỏ không quan trọng
    createOrderMutation.mutate(payload);
  };

  const handleSaveDraft = () => {
    if (items.length === 0) {
        toast.error('Giỏ hàng trống, không thể lưu nháp');
        return;
    }

    const customerName = selectedCustomer ? selectedCustomer.full_name : 'Khách lẻ';

    const payload = {
        customer_id: selectedCustomer?.id || null,
        customer_name: customerName,
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          uom_id: item.uom_id || null
        })),
        payment_method: 'cash', 
        is_debt: false,
        total_price: cartTotal,
        status: 'draft',
        amount_paid: 0
    };
    
    // @ts-ignore
    createOrderMutation.mutate(payload);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l shadow-sm">
      {/* 1. HEADER: Chọn Khách Hàng */}
      <div className="p-4 border-b bg-gray-50">
        {selectedCustomer ? (
          <div className="flex justify-between items-center bg-blue-50 p-3 rounded-md border border-blue-200">
            <div>
              <div className="font-bold text-blue-700">{selectedCustomer.full_name}</div>
              <div className="text-xs text-blue-500">{selectedCustomer.phone_number}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : (
          <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full flex justify-between">
                <span className="flex items-center"><User className="mr-2 h-4 w-4" /> Chọn Khách Hàng</span>
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tìm kiếm khách hàng</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Tên hoặc số điện thoại..." 
                    className="pl-9"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>

                <Dialog open={isCreateCustomerOpen} onOpenChange={setIsCreateCustomerOpen}>
                        <DialogTrigger asChild>
                             <Button variant="default"><Plus size={18} />Thêm khách hàng</Button>
                        </DialogTrigger>
                        {/* FORM TẠO KHÁCH HÀNG (Tái sử dụng code từ CustomerManager) */}
                        <DialogContent className="z-[9999]"> {/* z-index cao để đè lên modal tìm kiếm */}
                            <DialogHeader>
                                <DialogTitle>Thêm Khách Hàng Mới</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateCustomerSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Họ và tên</Label>
                                    <Input id="full_name" name="full_name" required placeholder="Nguyễn Văn A" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone_number">Số điện thoại</Label>
                                    <Input id="phone_number" name="phone_number" required placeholder="09xxxxxxx" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Địa chỉ</Label>
                                    <Input id="address" name="address" placeholder="Địa chỉ..." />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={createCustomerMutation.isPending}>
                                        {createCustomerMutation.isPending ? 'Đang lưu...' : 'Lưu Khách Hàng'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                
                <ScrollArea className="h-[300px] border rounded-md">
                  {customers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">Không tìm thấy khách hàng.</div>
                  ) : (
                    customers.map((cus: any) => (
                      <div 
                        key={cus.id} 
                        className="p-3 hover:bg-slate-100 cursor-pointer border-b last:border-0 flex justify-between"
                        onClick={() => {
                          setSelectedCustomer(cus);
                          setIsCustomerModalOpen(false);
                        }}
                      >
                        <div>
                          <div className="font-medium">{cus.full_name}</div>
                          <div className="text-xs text-gray-500">{cus.phone_number}</div>
                        </div>
                        <div className="text-xs font-semibold text-gray-400">
                          Nợ: {new Intl.NumberFormat('vi-VN').format(cus.total_debt || 0)}đ
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 2. BODY: Danh sách sản phẩm trong giỏ */}
      <ScrollArea className="flex-1 p-4">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
            <div className="p-4 bg-gray-50 rounded-full">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
            <p>Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 items-start">
                <div className="flex-1">
                  <div className="font-medium text-sm line-clamp-2">{item.name}</div>
                  <div className="text-xs text-gray-500">
                    {new Intl.NumberFormat('vi-VN').format(item.price)}đ /{item.uom_name}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                   <Button 
                      variant="outline" size="icon" className="h-6 w-6"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >-</Button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <Button 
                      variant="outline" size="icon" className="h-6 w-6"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >+</Button>
                </div>
                
                <div className="text-right min-w-[60px]">
                  <div className="font-bold text-sm">
                    {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-[10px] text-red-500 hover:underline mt-1"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* 3. FOOTER: Tổng tiền & Thanh toán */}
      <div className="p-4 bg-slate-50 border-t space-y-3">
        {/* Total info */}
        <div className="flex justify-between text-lg font-bold">
            <span>Tổng cộng:</span>
            <span className="text-primary">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* NÚT MỚI: LƯU NHÁP */}
          <Button 
            variant="outline"
            className="col-span-2 border-orange-200 text-orange-700 hover:bg-orange-50 flex items-center gap-2"
            disabled={createOrderMutation.isPending || items.length === 0}
            onClick={handleSaveDraft}
          >
             <Save size={16} /> Lưu đơn nháp
          </Button>

          <Button 
            id="btn-pay-cash" 
            className="bg-green-600 hover:bg-green-700" 
            disabled={createOrderMutation.isPending || items.length === 0}
            onClick={() => handleCheckout('cash')}
          >
            <Banknote className="mr-2 h-4 w-4" /> Tiền Mặt (F4)
          </Button>
          
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={createOrderMutation.isPending || items.length === 0}
            onClick={() => handleCheckout('transfer')}
          >
            <CreditCard className="mr-2 h-4 w-4" /> Chuyển Khoản
          </Button>
          
          <Button 
            variant="outline" 
            className="col-span-2 border-red-200 text-red-600 hover:bg-red-50"
            disabled={createOrderMutation.isPending || items.length === 0}
            onClick={() => handleCheckout('debt')}
          >
            Ghi Nợ
          </Button>
        </div>
      </div>
    </div>
  );
}