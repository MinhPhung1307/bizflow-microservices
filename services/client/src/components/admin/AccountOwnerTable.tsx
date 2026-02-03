'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from "@/components/ui/textarea";
import { Search, Edit, RefreshCw, Trash2, AlertTriangle, Check, X } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface Props {
  onEdit: (owner: any) => void;
  statusFilter: string;
}

export default function AccountOwnerTable({ onEdit, statusFilter }: Props) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog States
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // 1. Fetch Owners
  const { data: owners = [], isLoading } = useQuery({
    queryKey: ['admin-owners', statusFilter],
    queryFn: async () => {
        const response = await api.get('/admin/owners', {
            params: statusFilter !== 'ALL' ? { status: statusFilter } : {}
        });
        return response.data;
    },
  });

  // 2. Fetch Plans
  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => (await api.get('/admin/plans')).data,
  });

  // Hàm cập nhật trạng thái linh hoạt (Dùng cho cả Duyệt, Từ chối và Thanh gạt)
const updateStatusMutation = useMutation({
  mutationFn: async ({ 
    id, 
    status, 
    currentStatus,
    reason
  }: { 
    id: string; 
    status?: string; 
    currentStatus?: string;
    reason?: string;
  }) => {
    // Logic xử lý trạng thái tiếp theo:
    // 1. Nếu truyền status trực tiếp (Check/X) -> Dùng luôn status đó
    // 2. Nếu không truyền status mà có currentStatus (Thanh gạt) -> Tự động đảo ngược
    let nextStatus = status;
    
    if (!nextStatus && currentStatus) {
      nextStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    }

    if (!nextStatus) throw new Error("Cần cung cấp trạng thái mục tiêu hoặc trạng thái hiện tại");

    return api.put('/admin/owners/status', { 
      ownerId: id, 
      status: nextStatus,
      reason: reason
    });
  },
  onSuccess: (res) => {
    toast.success(res.data.message || 'Cập nhật trạng thái thành công');
    // Làm mới danh sách để đồng bộ dữ liệu giữa các tab
    queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
    setIsRejectDialogOpen(false); // Đóng dialog sau khi xong
    setRejectReason(''); // Reset lý do
  },
  onError: (err: any) => {
    toast.error(err.response?.data?.message || 'Không thể thực hiện thao tác');
  }
});

  // --- MUTATION: Đổi Gói ---
  const changePlanMutation = useMutation({
    mutationFn: async () => {
        if (!selectedOwner?.id) throw new Error("Chưa chọn Owner");
        return api.put('/admin/owners/plan', { 
            ownerId: selectedOwner.id, 
            planId: Number(selectedPlanId)
        });
    },
    onSuccess: () => {
        toast.success(`Đã cập nhật gói cho ${selectedOwner?.full_name}`);
        setIsPlanDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi đổi gói')
  });

  // Handler khi nhấn nút X
  const handleOpenReject = (owner: any) => {
    setSelectedOwner(owner);
    setIsRejectDialogOpen(true);
  };

  // Handler xác nhận từ chối
  const confirmReject = () => {
    if (!rejectReason.trim()) {
      return toast.error("Vui lòng nhập lý do từ chối");
    }
    updateStatusMutation.mutate({ 
      id: selectedOwner.id, 
      status: 'REJECTED', 
      reason: rejectReason 
    });
  };

  // --- MUTATION: Xóa Owner ---
  const deleteOwnerMutation = useMutation({
    mutationFn: async (id: string) => {
        return api.delete(`/admin/owners/${id}`);
    },
    onSuccess: () => {
        toast.success('Đã xóa tài khoản chủ cửa hàng');
        setIsDeleteDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Không thể xóa tài khoản này')
  });

  // Handlers
const openPlanDialog = (owner: any) => {
      setSelectedOwner(owner);
      
      // Logic an toàn hơn:
      // 1. Nếu user đã có gói -> dùng gói đó
      // 2. Nếu chưa có -> dùng gói đầu tiên trong danh sách (nếu có)
      // 3. Nếu không có gói nào -> để chuỗi rỗng
      let defaultId = '';
      if (owner.plan_id) {
          defaultId = owner.plan_id.toString();
      } else if (plans.length > 0) {
          defaultId = plans[0].id.toString();
      }

      setSelectedPlanId(defaultId);
      setIsPlanDialogOpen(true);
  }

  const openDeleteDialog = (owner: any) => {
      setSelectedOwner(owner);
      setIsDeleteDialogOpen(true);
  }

  // Filter
  const filteredOwners = Array.isArray(owners) ? owners.filter((owner: any) => 
    owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner?.phone_number?.includes(searchTerm)
  ) : [];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 w-fit">
          <Search className="w-4 h-4 text-slate-400" />
          <Input 
            className="border-none h-8 w-[250px] focus-visible:ring-0 shadow-none" 
            placeholder="Tìm theo tên hoặc SĐT..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Chủ hộ kinh doanh</th>
              <th className="px-6 py-3">Tên hộ kinh doanh</th>
              <th className="px-6 py-3">Số điện thoại</th>
              <th className="px-6 py-3">Ngày đăng ký</th>

              {statusFilter !== 'REJECTED' && <th className="px-6 py-3">Gói hiện tại</th>}
              {statusFilter === 'REJECTED' && <th className="px-6 py-3">Lý do từ chối</th>}

              {statusFilter !== 'PENDING' && statusFilter !== 'REJECTED' && (
                <th className="px-6 py-3 text-center">Trạng thái</th>
              )}

              <th className="px-6 py-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
                <tr><td colSpan={7} className="p-4 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
            ) : filteredOwners.length === 0 ? (
                <tr><td colSpan={7} className="p-4 text-center text-slate-500">Không tìm thấy kết quả</td></tr>
            ) : (
                filteredOwners.map((owner: any) => {
                    if (!owner) return null;

                    // [LOGIC HIỂN THỊ TÊN GÓI]
                    // So sánh lỏng (==) để tránh lỗi string/number
                    const currentPlan = Array.isArray(plans) 
                        ? plans.find((p: any) => p?.id == owner.plan_id) 
                        : null;
                    const planName = currentPlan ? currentPlan.plan_name : 'Chưa có gói';

                    return (
                        <tr key={owner.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{owner.full_name}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{owner.shop_name}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono">{owner.phone_number}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono">{new Date(owner.created_at).toLocaleDateString('vi-VN')}</td>
                        
                        {/* Hiển thị Gói hoặc Lý do */}
                        {statusFilter !== 'REJECTED' ? (
                          <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                  {planName}
                              </span>
                          </td>
                        ) : (
                          <td className="px-6 py-4 text-red-600 italic">
                            {owner.rejection_reason || 'Không rõ lý do'}
                          </td>
                        )}

                        {statusFilter !== 'PENDING' && statusFilter !== 'REJECTED' && (
                            <td className="px-6 py-4">
                                {statusFilter === 'ALL' ? (
                                    <div className="flex justify-center">
                                        <span className={cn(
                                            "px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border",
                                            owner.status === 'ACTIVE' && "bg-green-50 text-green-700 border-green-200",
                                            owner.status === 'LOCKED' && "bg-red-50 text-red-700 border-red-200",
                                            owner.status === 'PENDING' && "bg-amber-50 text-amber-700 border-amber-200",
                                            owner.status === 'REJECTED' && "bg-slate-50 text-slate-700 border-slate-200"
                                        )}>
                                            {owner.status === 'ACTIVE' ? 'Hoạt động' : owner.status === 'LOCKED' ? 'Đã khóa' : owner.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <Switch 
                                            className="data-[state=checked]:bg-green-500"
                                            checked={owner.status === 'ACTIVE'} 
                                            onCheckedChange={() => updateStatusMutation.mutate({ id: owner.id, currentStatus: owner.status })}
                                            disabled={updateStatusMutation.isPending}
                                        />
                                        <span className={cn(
                                            "text-[10px] uppercase font-bold",
                                            owner.status === 'ACTIVE' ? "text-green-600" : "text-red-500"
                                        )}>
                                            {owner.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                                        </span>
                                    </div>
                                )}
                            </td>
                        )}

                        <td className="px-6 py-4 text-right">
                            {statusFilter === 'PENDING' ? (
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0" onClick={() => updateStatusMutation.mutate({ id: owner.id, status: 'ACTIVE' })}><Check className="w-4 h-4 text-white" /></Button>
                                    <Button size="sm" variant="outline" className="border-red-200 h-8 w-8 p-0" onClick={() => handleOpenReject(owner)}><X className="w-4 h-4 text-red-600" /></Button>
                                </div>
                            ) : statusFilter === 'REJECTED' ? (
                                // CHỈ HIỆN NÚT CHECK TRONG TAB TỪ CHỐI
                                <div className="flex justify-center">
                                    <Button 
                                      size="sm" 
                                      className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                                      onClick={() => updateStatusMutation.mutate({ id: owner.id, status: 'ACTIVE' })}
                                      title="Duyệt lại"
                                    >
                                        <Check className="w-4 h-4 text-white" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => onEdit(owner)}><Edit className="w-4 h-4 text-slate-500" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => openPlanDialog(owner)}><RefreshCw className="w-4 h-4 text-purple-600" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(owner)} className="hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                </div>
                            )}
                        </td>
                        </tr>
                    );
                })
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog Đổi Gói */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Thay đổi gói dịch vụ</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="text-sm">
                    Khách hàng: <strong>{selectedOwner?.full_name}</strong>
                </div>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Chọn gói..." />
                    </SelectTrigger>
                    <SelectContent>
												{Array.isArray(plans) && plans.map((p: any) => (
														<SelectItem key={p.id} value={p.id.toString()}>
																{/* SỬA DÒNG NÀY */}
																{p.plan_name} ({formatCurrency(p.price)})
														</SelectItem>
												))}
										</SelectContent>
                </Select>
                <Button 
										className="w-full mt-2" 
										onClick={() => changePlanMutation.mutate()}
										// Thêm điều kiện: Phải có selectedPlanId mới cho bấm
										disabled={changePlanMutation.isPending || !selectedPlanId || selectedPlanId === '0'}
								>
										{changePlanMutation.isPending ? 'Đang lưu...' : 'Xác nhận'}
								</Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Xác nhận Xóa */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Cảnh báo xóa tài khoản
                </DialogTitle>
                <DialogDescription>Hành động này không thể hoàn tác.</DialogDescription>
            </DialogHeader>
            <div className="py-2 text-sm text-slate-600">
                Bạn sắp xóa tài khoản <strong>{selectedOwner?.full_name}</strong>.<br/>
                Toàn bộ dữ liệu (Sản phẩm, Đơn hàng, Nhân viên) của họ sẽ bị xóa sạch.
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Hủy</Button>
                <Button 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => selectedOwner?.id && deleteOwnerMutation.mutate(selectedOwner.id)}
                    disabled={deleteOwnerMutation.isPending}
                >
                    {deleteOwnerMutation.isPending ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nhập lý do từ chối */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              Từ chối yêu cầu đăng ký
            </DialogTitle>
            <DialogDescription>
              Vui lòng cung cấp lý do từ chối để gửi thông báo cho hộ kinh doanh <strong>{selectedOwner?.full_name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Ví dụ: Thông tin cửa hàng không hợp lệ, Số điện thoại không liên lạc được..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Hủy bỏ
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmReject}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Đang gửi...' : 'Xác nhận từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}