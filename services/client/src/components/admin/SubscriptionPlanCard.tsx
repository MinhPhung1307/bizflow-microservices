'use client';

import { Edit, Trash2, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SubscriptionPlanCardProps {
  id?: string;
  name: string;
  price: string | number;
  duration_days?: number;
  features: any; // Chấp nhận mọi định dạng để xử lý linh hoạt
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function SubscriptionPlanCard({ 
  id, 
  name, 
  price, 
  duration_days,
  features, 
  onEdit, 
  onDelete 
}: SubscriptionPlanCardProps) {

  // Logic chuẩn hóa dữ liệu features (JSON mới, Mảng cũ, hoặc String)
  let featureList: string[] = [];

  try {
      // Trường hợp 1: Cấu trúc mới { limits: ..., display: [...] }
      if (features?.display && Array.isArray(features.display)) {
          featureList = features.display;
      } 
      // Trường hợp 2: Cấu trúc cũ (Mảng string đơn giản)
      else if (Array.isArray(features)) {
          featureList = features;
      } 
      // Trường hợp 3: Chuỗi JSON (nếu DB trả về string chưa parse)
      else if (typeof features === 'string') {
          const parsed = JSON.parse(features);
          if (parsed?.display && Array.isArray(parsed.display)) {
              featureList = parsed.display;
          } else if (Array.isArray(parsed)) {
              featureList = parsed;
          }
      }
  } catch (error) {
      console.error("Lỗi parse features gói dịch vụ:", error);
      featureList = []; // Fallback về rỗng nếu lỗi
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col h-full relative group">
      
      {/* Header Card */}
      <div className="mb-6 text-center border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide mb-1">{name}</h3>
        <div className="text-slate-500 text-sm mb-3">{duration_days} ngày sử dụng</div>
        <div className="flex items-baseline justify-center text-blue-600">
            <span className="text-3xl font-extrabold tracking-tight">
            {formatCurrency(price)}
            </span>
            <span className="ml-1 text-sm font-medium text-slate-500">VND/gói</span>
        </div>
      </div>

      {/* Danh sách tính năng */}
      <div className="flex-1 mb-6 overflow-y-auto max-h-[200px] custom-scrollbar">
        <ul className="space-y-3">
          {featureList.length > 0 ? (
            featureList.map((feature, i) => (
              <li key={i} className="text-slate-600 flex items-start gap-3 text-sm">
                <div className="mt-0.5 bg-green-100 p-1 rounded-full shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="leading-5">{feature}</span>
              </li>
            ))
          ) : (
            <li className="text-slate-400 italic text-center text-sm">Chưa có mô tả tính năng</li>
          )}
        </ul>
      </div>

      {/* Footer Actions */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
        <Button 
          variant="outline" 
          onClick={onEdit}
          className="w-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 group-hover:border-blue-200"
        >
          <Edit className="w-4 h-4 mr-2" /> Sửa
        </Button>
        <Button 
          variant="outline" 
          onClick={onDelete}
          className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 group-hover:border-red-200"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Xóa
        </Button>
      </div>
    </div>
  );
}