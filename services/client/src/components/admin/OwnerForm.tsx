'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Owner } from './AccountOwnerTable'; // Import interface Owner

interface Props {
  initialData?: Owner | null; // Nếu có dữ liệu thì là chế độ Sửa
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onCancel: () => void;
}

export default function OwnerForm({ initialData, onSubmit, isLoading, onCancel }: Props) {
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    shop_name: initialData?.shop_name || '',
    password: '',
  });

  // Khi mở form sửa, điền dữ liệu cũ vào
  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name,
        phone_number: initialData.phone_number,
        password: '', // Mật khẩu không hiển thị lại, chỉ nhập nếu muốn đổi
        shop_name: initialData?.shop_name,
      });
    } else {
        // Reset khi tạo mới
        setFormData({ full_name: '', phone_number: '', shop_name: '', password: '' });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Họ tên (*)</Label>
        <Input 
          required 
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          placeholder="Ví dụ: Nguyễn Văn A"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shop_name">Tên hộ kinh doanh (Tên cửa hàng)</Label>
        <Input 
          id="shop_name" 
          value={formData.shop_name}
          onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
          placeholder="Tiệm tạp hóa Bình Minh"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Số điện thoại (*)</Label>
        <Input 
          required 
          value={formData.phone_number}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          placeholder="0912345678"
        />
      </div>

      <div className="space-y-2">
        <Label>
            Mật khẩu {initialData ? '(Bỏ trống nếu không đổi)' : '(*)'}
        </Label>
        <Input 
          type="password"
          // Nếu là tạo mới thì bắt buộc, sửa thì không
          required={!initialData} 
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Đang lưu...' : (initialData ? 'Cập nhật' : 'Tạo mới')}
        </Button>
      </div>
    </form>
  );
}