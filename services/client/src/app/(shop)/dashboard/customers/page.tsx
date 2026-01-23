'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, Customer } from '@/services/customer.service';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CustomerManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    address: ''
  });

  // Fetch dữ liệu
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: () => customerService.getCustomers(searchTerm),
  });

  // Tạo khách hàng mới
  const createMutation = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: () => {
      toast.success('Thêm khách hàng thành công!');
      setIsModalOpen(false);
      setFormData({ full_name: '', phone_number: '', address: '' });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi khi tạo khách hàng'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Khách Hàng & Công Nợ</h1>
        <Button onClick={() => setIsModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
          + Thêm Khách Hàng
        </Button>
      </div>

      <div className="mb-6">
        <Input 
          placeholder="Tìm tên hoặc SĐT..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">Tên Khách Hàng</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">Số Điện Thoại</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">Địa Chỉ</th>
              <th className="px-6 py-4 text-right font-semibold text-gray-700">Dư Nợ Hiện Tại</th>
              <th className="px-6 py-4 text-center font-semibold text-gray-700">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-4 text-center">Đang tải...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">Chưa có khách hàng.</td></tr>
            ) : (
              customers.map((cus: Customer) => (
                <tr key={cus.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{cus.full_name}</td>
                  <td className="px-6 py-4 text-gray-600">{cus.phone_number}</td>
                  <td className="px-6 py-4 text-gray-600">{cus.address || '---'}</td>
                  <td className={`px-6 py-4 text-right font-bold ${cus.total_debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cus.total_debt)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button variant="ghost" size="sm" className="text-blue-600">Chi tiết</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm Khách */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Thêm Khách Hàng Mới</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Họ và Tên (*)</Label>
                <Input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Số Điện Thoại (*)</Label>
                <Input required value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Địa Chỉ</Label>
                <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-green-600 text-white" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo Mới'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}