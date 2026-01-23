'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, Customer } from '@/services/customer.service';
import { Users, Plus, History, Printer, Search } from 'lucide-react'; // Thêm icon Search
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

// Import UI Components (giả sử bạn đã có)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Cần cài shadcn dialog hoặc dùng modal tự viết

export const CustomerManager = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    // Form state
    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        address: ''
    });

    // 1. Fetch Data từ API
    const { data: customers = [], isLoading } = useQuery({
        queryKey: ['customers', searchTerm],
        queryFn: () => customerService.getCustomers(searchTerm),
    });

    // 2. Mutation Tạo Khách Mới
    const createMutation = useMutation({
        mutationFn: customerService.createCustomer,
        onSuccess: () => {
            toast.success('Thêm khách hàng thành công!');
            setIsDialogOpen(false);
            setFormData({ full_name: '', phone_number: '', address: '' });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Lỗi khi tạo khách hàng');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    // Tính toán thống kê nhanh
    const totalDebt = customers.reduce((sum, c) => sum + (c.total_debt || 0), 0);
    const newCustomersCount = customers.length; // Tạm tính tổng khách

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
             {/* Thẻ Thống Kê */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-slate-500 text-sm">Tổng nợ phải thu</p>
                    <h3 className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalDebt)}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-slate-500 text-sm">Tổng khách hàng</p>
                    <h3 className="text-2xl font-bold text-blue-600 mt-1">{newCustomersCount}</h3>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center gap-4">
                    <h3 className="font-bold text-lg text-slate-800 whitespace-nowrap">Danh sách khách hàng</h3>
                    
                    {/* Thanh tìm kiếm & Nút thêm */}
                    <div className="flex items-center gap-2 w-full justify-end">
                        <div className="relative hidden md:block w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Tìm tên, SĐT..." 
                                className="pl-8 h-9" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Dialog Thêm Khách */}
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700 h-9">
                                    <Plus size={16} className="mr-2" /> Thêm khách
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Thêm Khách Hàng Mới</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                    <div>
                                        <label className="text-sm font-medium">Họ tên (*)</label>
                                        <Input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Số điện thoại (*)</label>
                                        <Input required value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Địa chỉ</label>
                                        <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                                        <Button type="submit" disabled={createMutation.isPending}>
                                            {createMutation.isPending ? 'Đang lưu...' : 'Lưu lại'}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Khách hàng</th>
                                <th className="p-4">Địa chỉ/SĐT</th>
                                <th className="p-4 text-right">Tổng nợ</th>
                                <th className="p-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Chưa có khách hàng nào.</td></tr>
                            ) : (
                                customers.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{c.full_name}</div>
                                            <div className="text-xs text-slate-400">ID: {c.id.slice(0, 8)}...</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-700">{c.address || '---'}</div>
                                            <div className="text-xs text-slate-500">{c.phone_number}</div>
                                        </td>
                                        <td className={`p-4 text-right font-bold ${c.total_debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatCurrency(c.total_debt)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Chi tiết">
                                                    <History size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};