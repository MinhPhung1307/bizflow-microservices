'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, Customer } from '@/services/customer.service';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Pencil, Save, X, Phone, MapPin, DollarSign, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

export default function CustomerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // --- STATE CHO CHI TIẾT & CHỈNH SỬA ---
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false); 
  const [editFormData, setEditFormData] = useState<Partial<Customer>>({});

  const queryClient = useQueryClient();

  // 1. Fetch dữ liệu
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: () => customerService.getCustomers(searchTerm),
  });

  // 2. Mutation: Tạo khách hàng mới
  const createMutation = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: () => {
      toast.success('Thêm khách hàng thành công!');
      setIsCreateOpen(false);
      setEditFormData({}); // Reset form tạo mới (nếu dùng chung state, ở đây ta dùng form native)
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi khi tạo khách hàng'),
  });

  // 3. Mutation: Cập nhật khách hàng
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: Partial<Customer> }) => 
      customerService.updateCustomer(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsEditing(false);
      setSelectedCustomer(null);
      toast.success('Cập nhật thông tin thành công');
    },
    onError: () => toast.error('Lỗi khi cập nhật khách hàng')
  });

  // Effect: Khi mở modal chi tiết thì fill dữ liệu vào form sửa
  useEffect(() => {
    if (selectedCustomer) {
      setIsEditing(false);
      setEditFormData({
        full_name: selectedCustomer.full_name,
        phone_number: selectedCustomer.phone_number,
        address: selectedCustomer.address,
      });
    }
  }, [selectedCustomer]);

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      full_name: formData.get('full_name') as string,
      phone_number: formData.get('phone_number') as string,
      address: formData.get('address') as string,
    });
  };

  const handleUpdateSubmit = () => {
    if (!selectedCustomer) return;
    updateMutation.mutate({
      id: selectedCustomer.id,
      payload: editFormData
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Quản Lý Khách Hàng</h1>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
          + Thêm Khách Hàng
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <Input 
          placeholder="Tìm kiếm theo tên hoặc số điện thoại..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">Tên Khách Hàng</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">Liên Hệ</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">Địa Chỉ</th>
              <th className="px-6 py-4 text-right font-semibold text-gray-700">Công Nợ</th>
              <th className="px-6 py-4 text-center font-semibold text-gray-700">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Chưa có khách hàng nào.</td></tr>
            ) : (
              customers.map((cus: Customer) => (
                <tr key={cus.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{cus.full_name}</div>
                    <div className="text-xs text-gray-400">ID: {cus.id.slice(0, 6)}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{cus.phone_number}</td>
                  <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]">{cus.address || '---'}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${cus.total_debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cus.total_debt)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedCustomer(cus)} // Kích hoạt Modal Chi Tiết
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      Chi tiết / Sửa
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL TẠO MỚI --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Khách Hàng Mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Họ và Tên (*)</Label>
              <Input name="full_name" required placeholder="Nguyễn Văn A" />
            </div>
            <div className="space-y-2">
              <Label>Số Điện Thoại (*)</Label>
              <Input name="phone_number" required placeholder="09xxxxxxx" />
            </div>
            <div className="space-y-2">
              <Label>Địa Chỉ</Label>
              <Input name="address" placeholder="Nhập địa chỉ..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Đang lưu...' : 'Lưu Khách Hàng'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- MODAL CHI TIẾT & CHỈNH SỬA --- */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {isEditing ? 'Chỉnh Sửa Thông Tin' : 'Thông Tin Khách Hàng'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Cập nhật thông tin bên dưới và lưu lại.' : 'Xem chi tiết thông tin khách hàng.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="grid gap-4 py-4">
              {!isEditing ? (
                // --- VIEW MODE ---
                <>
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {selectedCustomer.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{selectedCustomer.full_name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Phone className="w-3 h-3 mr-1" /> {selectedCustomer.phone_number}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1">
                      <Label className="text-gray-500 text-xs uppercase">Tổng nợ</Label>
                      <div className="flex items-center gap-2 font-bold text-red-600 text-lg">
                        <DollarSign className="h-5 w-5" />
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedCustomer.total_debt)}
                      </div>
                    </div>
                     <div className="space-y-1">
                      <Label className="text-gray-500 text-xs uppercase">Ngày tham gia</Label>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {selectedCustomer.created_at ? format(new Date(selectedCustomer.created_at), 'dd/MM/yyyy') : 'N/A'}
                      </div>
                    </div>
                    <div className="col-span-2 space-y-1 border-t pt-3">
                      <Label className="text-gray-500 text-xs uppercase">Địa chỉ</Label>
                      <div className="flex items-center gap-2 font-medium">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {selectedCustomer.address || 'Chưa cập nhật'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // --- EDIT MODE ---
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Họ và tên</Label>
                    <Input 
                      value={editFormData.full_name || ''} 
                      onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <Input 
                      value={editFormData.phone_number || ''} 
                      onChange={(e) => setEditFormData({...editFormData, phone_number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Địa chỉ</Label>
                    <Input 
                      value={editFormData.address || ''} 
                      onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            {!isEditing ? (
              <>
                <Button variant="secondary" onClick={() => setSelectedCustomer(null)}>Đóng</Button>
                <Button onClick={() => setIsEditing(true)}>
                  <Pencil className="w-4 h-4 mr-2" /> Chỉnh sửa
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" /> Hủy
                </Button>
                <Button onClick={handleUpdateSubmit} disabled={updateMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" /> 
                  {updateMutation.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}