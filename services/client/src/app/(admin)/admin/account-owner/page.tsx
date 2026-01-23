'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import components
import AccountOwnerTable from '@/components/admin/AccountOwnerTable';
import OwnerForm from '@/components/admin/OwnerForm';
import { Owner } from '@/types';

export default function AccountOwnerPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);

  // 1. Mutation Tạo mới
  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      return api.post('/admin/owners', newData);
    },
    onSuccess: () => {
      toast.success('Thêm chủ cửa hàng thành công!');
      handleCloseDialog();
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo mới');
    }
  });

  // 2. Mutation Cập nhật
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
        // API: PUT /admin/owners/:id
      return api.put(`/admin/owners/${selectedOwner?.id}`, data);
    },
    onSuccess: () => {
      toast.success('Cập nhật thông tin thành công!');
      handleCloseDialog();
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật');
    }
  });

  // Xử lý khi submit form
  const handleSubmit = (formData: any) => {
    if (selectedOwner) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  // Mở Dialog để thêm mới
  const handleOpenCreate = () => {
    setSelectedOwner(null);
    setIsDialogOpen(true);
  };

  // Mở Dialog để sửa (được gọi từ Table)
  const handleOpenEdit = (owner: Owner) => {
    setSelectedOwner(owner);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedOwner(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Chủ Cửa Hàng</h1>
          <p className="text-slate-500">Danh sách các tài khoản Owner trong hệ thống</p>
        </div>
        
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" /> Thêm Owner
        </Button>
      </div>

      {/* Bảng dữ liệu - Truyền hàm onEdit xuống */}
      <Tabs defaultValue="ALL" className="w-full">
    
        <TabsList className="bg-slate-100 p-1 rounded-lg w-fit">
          <TabsTrigger value="ALL" className="px-6 data-[state=active]:bg-white data-[state=active]:text-blue-600 font-semibold">
            Tất cả
          </TabsTrigger>
          <TabsTrigger value="PENDING" className="px-6 data-[state=active]:bg-white data-[state=active]:text-amber-600 font-semibold">
            Chờ duyệt
          </TabsTrigger>
          <TabsTrigger value="ACTIVE" className="px-6 data-[state=active]:bg-white data-[state=active]:text-green-600 font-semibold">
            Hoạt động
          </TabsTrigger>
          <TabsTrigger value="LOCKED" className="px-6 data-[state=active]:bg-white data-[state=active]:text-red-600 font-semibold">
            Đã khóa
          </TabsTrigger>
          <TabsTrigger value="REJECTED" className="px-6 data-[state=active]:bg-white data-[state=active]:text-slate-600 font-semibold">
            Từ chối
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ALL" className="mt-4 outline-none">
          <AccountOwnerTable onEdit={handleOpenEdit} statusFilter="ALL" />
        </TabsContent>

        <TabsContent value="PENDING" className="mt-4 outline-none">
          <AccountOwnerTable onEdit={handleOpenEdit} statusFilter="PENDING" />
        </TabsContent>
        
        <TabsContent value="ACTIVE" className="mt-4 outline-none">
          <AccountOwnerTable onEdit={handleOpenEdit} statusFilter="ACTIVE" />
        </TabsContent>

        <TabsContent value="LOCKED" className="mt-4 outline-none">
          <AccountOwnerTable onEdit={handleOpenEdit} statusFilter="LOCKED" />
        </TabsContent>

        <TabsContent value="REJECTED" className="mt-4 outline-none">
          <AccountOwnerTable onEdit={handleOpenEdit} statusFilter="REJECTED" />
        </TabsContent>
      </Tabs>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
                {selectedOwner ? 'Cập nhật thông tin' : 'Thêm Chủ Cửa Hàng Mới'}
            </DialogTitle>
          </DialogHeader>
          
          <OwnerForm 
            initialData={selectedOwner}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}