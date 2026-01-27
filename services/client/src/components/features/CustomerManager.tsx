'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, Customer } from '@/services/customer.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, User, Phone, MapPin, DollarSign, Calendar, Pencil, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CustomerManager() {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // --- STATE CHO CHI TIẾT & CHỈNH SỬA ---
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false); // Trạng thái đang sửa hay đang xem
  const [editFormData, setEditFormData] = useState<Partial<Customer>>({}); // Dữ liệu form sửa

  const queryClient = useQueryClient();

  // --- QUERY: Lấy danh sách khách hàng ---
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customerService.getCustomers(search),
  });

  // --- MUTATION: Tạo mới ---
  const createMutation = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsCreateOpen(false);
      toast.success('Thêm khách hàng thành công');
    },
    onError: () => toast.error('Lỗi khi thêm khách hàng')
  });

  // --- MUTATION: Cập nhật ---
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: Partial<Customer> }) => 
      customerService.updateCustomer(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsEditing(false);
      setSelectedCustomer(null); // Đóng modal sau khi lưu xong
      toast.success('Cập nhật thông tin thành công');
    },
    onError: () => toast.error('Lỗi khi cập nhật khách hàng')
  });

  // Xử lý khi mở modal chi tiết: Reset chế độ sửa và load dữ liệu vào form
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

  const totalDebt = customers.reduce((sum, cus) => sum + cus.total_debt, 0);

  return (
    <div className="space-y-6">
      {/* HEADER STATS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Khách Hàng</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Công Nợ</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalDebt)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ACTION BAR */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc SĐT..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Thêm Khách Hàng</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm Khách Hàng Mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
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
                <Input id="address" name="address" placeholder="TP. Hồ Chí Minh" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Đang lưu...' : 'Lưu Khách Hàng'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* DATA TABLE */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Khách Hàng</TableHead>
              <TableHead>Số Điện Thoại</TableHead>
              <TableHead>Công Nợ</TableHead>
              <TableHead className="text-right">Hành Động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">Đang tải dữ liệu...</TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Không tìm thấy khách hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.full_name}</TableCell>
                  <TableCell>{customer.phone_number}</TableCell>
                  <TableCell>
                    {customer.total_debt > 0 ? (
                      <Badge variant="destructive">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer.total_debt)}
                      </Badge>
                    ) : (
                      <span className="text-green-600 font-medium">0 ₫</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <FileText className="h-4 w-4 mr-1" /> Chi tiết / Sửa
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- MODAL CHI TIẾT & CHỈNH SỬA (UPDATED) --- */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {isEditing ? 'Chỉnh Sửa Thông Tin' : 'Thông Tin Khách Hàng'}
              {!isEditing && (
                <Badge variant="outline" className="ml-2">ID: {selectedCustomer?.id.slice(0, 6)}</Badge>
              )}
            </DialogTitle>
            <CardDescription>
              {isEditing ? 'Cập nhật thông tin khách hàng bên dưới' : 'Xem chi tiết và lịch sử giao dịch'}
            </CardDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="grid gap-4 py-4">
              {!isEditing ? (
                // --- CHẾ ĐỘ XEM (VIEW MODE) ---
                <>
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {selectedCustomer.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{selectedCustomer.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedCustomer.phone_number}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Tổng nợ hiện tại</Label>
                      <div className="flex items-center gap-2 font-bold text-red-600 text-lg">
                        <DollarSign className="h-5 w-5" />
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedCustomer.total_debt)}
                      </div>
                    </div>
                     <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Ngày tạo</Label>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {selectedCustomer.created_at ? format(new Date(selectedCustomer.created_at), 'dd/MM/yyyy') : 'N/A'}
                      </div>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-muted-foreground text-xs">Địa chỉ</Label>
                      <div className="flex items-center gap-2 font-medium">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {selectedCustomer.address || 'Chưa cập nhật'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // --- CHẾ ĐỘ SỬA (EDIT MODE) ---
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