'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch"; // Cần cài shadcn switch
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemConfigForm() {
  // Giả lập dữ liệu config
  const [config, setConfig] = useState({
    maintenanceMode: false,
    aiModelVersion: 'gpt-4o-mini',
    taxVatDefault: 8,
    maxUploadSize: 10, // MB
    supportEmail: 'support@bizflow.vn'
  });

  const handleSave = () => {
    // Gọi API PUT /admin/config
    toast.success('Đã lưu cấu hình hệ thống');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-8 max-w-2xl">
      
      {/* Nhóm: Chung */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Cài đặt chung</h3>
        
        <div className="flex items-center justify-between">
            <div className="space-y-0.5">
                <Label className="text-base">Chế độ bảo trì</Label>
                <p className="text-sm text-slate-500">Tạm ngưng truy cập để bảo trì hệ thống</p>
            </div>
            <Switch 
                checked={config.maintenanceMode} 
                onCheckedChange={(checked) => setConfig({...config, maintenanceMode: checked})} 
            />
        </div>

        <div className="space-y-2">
            <Label>Email hỗ trợ kỹ thuật</Label>
            <Input 
                value={config.supportEmail} 
                onChange={(e) => setConfig({...config, supportEmail: e.target.value})} 
            />
        </div>
      </div>

      {/* Nhóm: AI & Dữ liệu */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">AI & Xử lý dữ liệu</h3>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Phiên bản Model AI</Label>
                <Input 
                    value={config.aiModelVersion} 
                    onChange={(e) => setConfig({...config, aiModelVersion: e.target.value})} 
                />
                <p className="text-xs text-slate-500">Model dùng cho RAG và gợi ý đơn hàng</p>
            </div>
            <div className="space-y-2">
                <Label>VAT Mặc định (%)</Label>
                <Input 
                    type="number"
                    value={config.taxVatDefault} 
                    onChange={(e) => setConfig({...config, taxVatDefault: Number(e.target.value)})} 
                />
            </div>
        </div>
      </div>

      <Button onClick={handleSave} className="w-full bg-slate-900 hover:bg-slate-800">
        <Save className="w-4 h-4 mr-2" /> Lưu thay đổi
      </Button>
    </div>
  );
}