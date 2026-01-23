'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch"; 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import SubscriptionPlanCard from '@/components/admin/SubscriptionPlanCard';

export default function SubscriptionPlansPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Form State: Tách biệt Limits (Logic) và Display (Hiển thị)
  const [formData, setFormData] = useState({
    plan_name: '',
    price: 0,
    duration_days: 30,
    
    // Cấu hình giới hạn (Dùng cho code logic)
    max_products: 50,
    max_employees: 1,
    ai_enabled: false,
    
    // Cấu hình hiển thị (Dùng cho thẻ Card)
    display_text: '', 
  });

  // 1. Fetch Plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => (await api.get('/admin/plans')).data
  });

  // 2. Submit Mutation (Xử lý gộp JSON)
  const submitMutation = useMutation({
    mutationFn: async () => {
      // Chuẩn bị payload chuẩn JSON
      const payload = {
          plan_name: formData.plan_name,
          price: formData.price,
          duration_days: formData.duration_days,
          features: {
              // Object 'limits' để Backend kiểm tra logic
              limits: {
                  max_products: Number(formData.max_products),
                  max_employees: Number(formData.max_employees),
                  ai_enabled: formData.ai_enabled,
              },
              // Array 'display' để Frontend hiển thị text đẹp
              display: formData.display_text.split('\n').filter(t => t.trim() !== '')
          }
      };

      if (selectedPlan) {
        return api.put(`/admin/plans/${selectedPlan.id}`, payload);
      } else {
        return api.post('/admin/plans', payload);
      }
    },
    onSuccess: () => {
      toast.success(selectedPlan ? 'Cập nhật thành công!' : 'Tạo gói thành công!');
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
    },
    onError: (err: any) => toast.error('Có lỗi xảy ra!')
  });

  const resetForm = () => {
      setFormData({
        plan_name: '', price: 0, duration_days: 30,
        max_products: 50, max_employees: 1, ai_enabled: false, display_text: ''
      });
      setSelectedPlan(null);
  }

  // Đổ dữ liệu vào form khi bấm Sửa
  const handleEdit = (plan: any) => {
    setSelectedPlan(plan);
    
    // Parse an toàn features
    let limits = { max_products: 0, max_employees: 0, ai_enabled: false };
    let display = [];

    // Kiểm tra cấu trúc features trong DB (có thể là string hoặc object)
    let featObj = plan.features;
    if (typeof featObj === 'string') {
        try { featObj = JSON.parse(featObj); } catch(e) {}
    }

    if (featObj?.limits) {
        limits = featObj.limits;
        display = featObj.display || [];
    } else if (Array.isArray(featObj)) {
        // Hỗ trợ cấu trúc cũ (chỉ là mảng string)
        display = featObj;
    }

    setFormData({
        plan_name: plan.plan_name,
        price: Number(plan.price),
        duration_days: plan.duration_days,
        max_products: limits.max_products || 0,
        max_employees: limits.max_employees || 0,
        ai_enabled: limits.ai_enabled || false,
        display_text: Array.isArray(display) ? display.join('\n') : '',
    });
    setIsDialogOpen(true);
  };

  // Hàm xóa (Giữ nguyên logic bạn đã có hoặc thêm vào đây nếu cần)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/plans/${id}`),
    onSuccess: () => {
        toast.success('Đã xóa gói');
        queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Gói Dịch Vụ</h1>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-blue-600">
            <Plus size={18} className="mr-2" /> Tạo gói mới
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlan ? 'Cập nhật Gói' : 'Thêm Gói Mới'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-2">
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                      <Label>Tên gói dịch vụ</Label>
                      <Input value={formData.plan_name} onChange={e => setFormData({...formData, plan_name: e.target.value})} placeholder="VD: Gói Doanh Nghiệp" />
                  </div>
                  <div className="space-y-2">
                      <Label>Giá (VNĐ)</Label>
                      <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                      <Label>Thời hạn (Ngày)</Label>
                      <Input type="number" value={formData.duration_days} onChange={e => setFormData({...formData, duration_days: Number(e.target.value)})} />
                  </div>
              </div>

              {/* Cấu hình Giới hạn (Logic) */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                  <h3 className="font-semibold text-slate-700 text-sm uppercase">Thiết lập giới hạn (System Logic)</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label>Số sản phẩm tối đa</Label>
                          <Input type="number" value={formData.max_products} onChange={e => setFormData({...formData, max_products: Number(e.target.value)})} />
                          <p className="text-xs text-slate-500">Nhập số lớn (vd: 99999) nếu không giới hạn</p>
                      </div>
                      <div className="space-y-2">
                          <Label>Số nhân viên tối đa</Label>
                          <Input type="number" value={formData.max_employees} onChange={e => setFormData({...formData, max_employees: Number(e.target.value)})} />
                      </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                      <div className="space-y-0.5">
                          <Label>Kích hoạt AI Assistant?</Label>
                          <p className="text-xs text-slate-500">Cho phép dùng tính năng gợi ý đơn hàng</p>
                      </div>
                      <Switch checked={formData.ai_enabled} onCheckedChange={(c) => setFormData({...formData, ai_enabled: c})} />
                  </div>
              </div>

              {/* Cấu hình Hiển thị */}
              <div className="space-y-2">
                  <Label>Mô tả hiển thị (Trên thẻ gói)</Label>
                  <p className="text-xs text-slate-500 mb-2">Nhập mỗi dòng một tính năng để hiển thị đẹp mắt cho người dùng.</p>
                  <textarea 
                      className="flex min-h-[100px] w-full rounded-md border border-input px-3 py-2 text-sm"
                      rows={5}
                      value={formData.display_text} 
                      onChange={e => setFormData({...formData, display_text: e.target.value})} 
                      placeholder="- Tối đa 500 sản phẩm&#10;- 2 Nhân viên&#10;- Hỗ trợ AI cơ bản"
                  />
              </div>

              <Button className="w-full" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? 'Đang lưu...' : 'Lưu gói dịch vụ'}
              </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan: any) => (
            <SubscriptionPlanCard 
                key={plan.id} 
                {...plan} // Truyền toàn bộ props (bao gồm features)
                name={plan.plan_name} // Map lại name cho đúng props component
                onEdit={() => handleEdit(plan)} 
                onDelete={() => deleteMutation.mutate(plan.id)}
            />
        ))}
      </div>
    </div>
  );
}