'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch"; 
import { Save, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemConfigForm() {
  const queryClient = useQueryClient();

  // State local để nhập liệu
  const [formData, setFormData] = useState({
    maintenance_mode: false,
    ai_model_version: 'gpt-4o-mini',
    tax_vat_default: 8,
    max_upload_size_mb: 10,
    support_email: 'support@bizflow.vn'
  });

  // 1. Fetch dữ liệu từ API
  const { data: config, isLoading, isError } = useQuery({
    queryKey: ['admin-system-config'],
    queryFn: async () => (await api.get('/admin/config')).data,
  });

  // 2. Cập nhật state khi có dữ liệu từ DB
  useEffect(() => {
    if (config) {
        setFormData({
            maintenance_mode: config.maintenance_mode,
            ai_model_version: config.ai_model_version,
            tax_vat_default: Number(config.tax_vat_default),
            max_upload_size_mb: config.max_upload_size_mb,
            support_email: config.support_email
        });
    }
  }, [config]);

  // 3. Mutation Lưu cấu hình
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
        return api.put('/admin/config', data);
    },
    onSuccess: () => {
        toast.success('Đã lưu cấu hình hệ thống thành công');
        queryClient.invalidateQueries({ queryKey: ['admin-system-config'] });
    },
    onError: () => {
        toast.error('Lỗi khi lưu cấu hình');
    }
  });

  if (isLoading) return <div className="p-6 text-center text-slate-500">Đang tải cấu hình...</div>;
  if (isError) return <div className="p-6 text-center text-red-500">Không thể tải cấu hình hệ thống.</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-8 max-w-3xl animate-fade-in">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
            <h3 className="font-semibold text-lg text-slate-800">Thông số vận hành</h3>
            <p className="text-sm text-slate-500">Cập nhật các thiết lập toàn cục cho BizFlow</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-system-config'] })}>
            <RefreshCw className="w-4 h-4 mr-2" /> Làm mới
        </Button>
      </div>
      
      {/* NHÓM 1: TRẠNG THÁI & LIÊN HỆ */}
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="space-y-0.5">
                <Label className="text-base font-medium text-slate-900">Chế độ bảo trì</Label>
                <p className="text-sm text-slate-500">Khi bật, chỉ Admin mới có thể truy cập hệ thống.</p>
            </div>
            <Switch 
                checked={formData.maintenance_mode} 
                onCheckedChange={(checked) => setFormData({...formData, maintenance_mode: checked})} 
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label>Email hỗ trợ kỹ thuật</Label>
                <Input 
                    value={formData.support_email} 
                    onChange={(e) => setFormData({...formData, support_email: e.target.value})} 
                    placeholder="admin@bizflow.vn"
                />
            </div>
            <div className="space-y-2">
                <Label>Giới hạn Upload (MB)</Label>
                <Input 
                    type="number"
                    value={formData.max_upload_size_mb} 
                    onChange={(e) => setFormData({...formData, max_upload_size_mb: Number(e.target.value)})} 
                />
            </div>
        </div>
      </div>

      {/* NHÓM 2: AI & TÀI CHÍNH */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-slate-800">Cấu hình AI & Tài chính</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label>Phiên bản AI Model</Label>
                <Input 
                    value={formData.ai_model_version} 
                    onChange={(e) => setFormData({...formData, ai_model_version: e.target.value})} 
                    placeholder="gpt-4o-mini"
                />
                <p className="text-xs text-slate-500">Model dùng cho các tác vụ gợi ý đơn hàng</p>
            </div>
            <div className="space-y-2">
                <Label>VAT Mặc định (%)</Label>
                <div className="relative">
                    <Input 
                        type="number"
                        className="pr-8"
                        value={formData.tax_vat_default} 
                        onChange={(e) => setFormData({...formData, tax_vat_default: Number(e.target.value)})} 
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 text-sm font-medium">%</span>
                </div>
                <p className="text-xs text-slate-500">Thuế suất áp dụng chung khi tạo sản phẩm mới</p>
            </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="pt-6 border-t flex justify-end">
          <Button 
            onClick={() => saveMutation.mutate(formData)} 
            disabled={saveMutation.isPending}
            className="bg-slate-900 hover:bg-slate-800 min-w-[140px]"
          >
            {saveMutation.isPending ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                </>
            ) : (
                <>
                    <Save className="w-4 h-4 mr-2" />
                    Lưu thay đổi
                </>
            )}
          </Button>
      </div>
    </div>
  );
}