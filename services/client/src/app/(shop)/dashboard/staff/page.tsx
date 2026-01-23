'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, KeyRound, AlertTriangle, Trash2 } from 'lucide-react';

import { ownerService } from '@/services/owner.service';

export default function StaffManager() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<any>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [newPassword, setNewPassword] = useState('');
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        password: ''
    });

    // Fetch dữ liệu nhân viên
    const { data: staff = [], isLoading } = useQuery({
        queryKey: ['staff', searchTerm],
        queryFn: () => ownerService.getEmployees(searchTerm),
    });

    // Mutation tạo nhân viên
    const createMutation = useMutation({
        mutationFn: ownerService.createEmployee,
        onSuccess: () => {
        toast.success('Thêm nhân viên thành công!');
        setIsModalOpen(false);
        setFormData({ full_name: '', phone_number: '', password: '' });
        queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi khi tạo nhân viên'),
    });

    // Mutation: Đổi mật khẩu (PUT)
    const passwordMutation = useMutation({
        mutationFn: (data: { id: string; password: any }) => 
        ownerService.changeStaffPassword(data.id, { password: data.password }),
        onSuccess: () => {
        toast.success('Đã đổi mật khẩu thành công');
        setIsPasswordModalOpen(false);
        setNewPassword('');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi khi đổi mật khẩu'),
    });

    // Mutation khóa/mở khóa
    const toggleStatusMutation = useMutation({
        mutationFn: ownerService.toggleStaffStatus,
        onSuccess: () => {
        toast.success('Cập nhật trạng thái thành công');
        setIsConfirmModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['staff'] });
        }
    });

    // Mutation xóa nhân viên
    const deleteMutation = useMutation({
        mutationFn: ownerService.deleteEmployee,
        onSuccess: () => {
            toast.success('Xóa nhân viên thành công');
            setIsDeleteModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi khi xóa nhân viên'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    return (
        <div className="p-6">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Quản Lý Nhân Viên</h1>
            <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                + Thêm Nhân Viên
            </Button>
        </div>

        <div className="mb-6">
            <Input 
                placeholder="Tìm tên hoặc SĐT nhân viên..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-100 border-b">
                    <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Họ Tên</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Số Điện Thoại</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Trạng Thái</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Ngày Tạo</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Thao Tác</th>
                    </tr>
                </thead>
            <tbody>
                {isLoading ? (
                <tr><td colSpan={5} className="p-4 text-center">Đang tải...</td></tr>
                ) : staff.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-gray-500">Chưa có nhân viên nào.</td></tr>
                ) : (
                staff.map((member: any) => (
                    <tr key={member.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{member.full_name}</td>
                    <td className="px-6 py-4 text-gray-600">{member.phone_number}</td>
                    <td className="px-6 py-4 text-center">
                        <Badge variant={member.status === 'ACTIVE' ? 'success' : 'destructive'}>
                            {member.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500">
                        {new Date(member.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-center flex justify-center gap-2">
                        <Button 
                            variant="ghost" size="sm" 
                            className={member.status === 'ACTIVE' ? "text-red-600 cursor-pointer" : "text-green-600 cursor-pointer"}
                            onClick={() => {
                                setSelectedStaff(member);
                                setIsConfirmModalOpen(true);
                            }}
                        >
                            {member.status === 'ACTIVE' ? <Lock size={16} /> : <Unlock size={16} />}
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-600 cursor-pointer"
                            onClick={() => {
                                setSelectedStaff(member);
                                setIsPasswordModalOpen(true);
                            }}
                        >
                            <KeyRound size={16} />
                        </Button>
                        <Button 
                            variant="ghost" size="sm" 
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                            onClick={() => {
                                setSelectedStaff(member);
                                setIsDeleteModalOpen(true);
                            }}
                        >
                            <Trash2 size={16} />
                        </Button>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>

        {/* Modal Thêm Nhân Viên */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-4">Tạo Tài Khoản Nhân Viên</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label>Họ và Tên (*)</Label>
                    <Input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <Label>Số Điện Thoại (Tên đăng nhập) (*)</Label>
                    <Input required value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <Label>Mật khẩu khởi tạo (*)</Label>
                    <Input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                    <Button type="submit" className="bg-blue-600 text-white" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Đang tạo...' : 'Tạo Nhân Viên'}
                    </Button>
                </div>
                </form>
            </div>
            </div>
        )}

        {/* MODAL Đổi mật khẩu */}
        <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
            {selectedStaff && (
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Đổi mật khẩu: {selectedStaff.full_name}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label>Mật khẩu mới (ít nhất 6 ký tự)</Label>
                        <Input 
                            type="password" 
                            placeholder="Nhập mật khẩu mới..." 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>Hủy</Button>
                        <Button 
                            className="bg-blue-600 cursor-pointer"
                            disabled={newPassword.length < 6 || passwordMutation.isPending}
                            onClick={() => passwordMutation.mutate({ id: selectedStaff?.id, password: newPassword })}
                        >
                            {passwordMutation.isPending ? 'Đang lưu...' : 'Cập nhật'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            )}
        </Dialog>

        {/* MODAL Xác nhận Khóa/Mở khóa */}
        <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
            {selectedStaff && (
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-amber-500" /> Xác nhận thay đổi
                        </DialogTitle>
                        <DialogDescription className="py-2">
                            Bạn có chắc chắn muốn <strong>{selectedStaff.status === 'ACTIVE' ? 'KHÓA' : 'MỞ KHÓA'}</strong> tài khoản của nhân viên <strong>{selectedStaff.full_name}</strong>?
                            {selectedStaff.status === 'ACTIVE' && " Sau khi khóa, nhân viên này sẽ không thể đăng nhập vào hệ thống."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>Hủy</Button>
                        <Button 
                            variant={selectedStaff.status === 'ACTIVE' ? "destructive" : "default"}
                            className={selectedStaff.status !== 'ACTIVE' ? "bg-green-600 hover:bg-green-700 cursor-pointer" : "cursor-pointer"}
                            disabled={toggleStatusMutation.isPending}
                            onClick={() => toggleStatusMutation.mutate(selectedStaff?.id)}
                        >
                            {toggleStatusMutation.isPending ? 'Đang xử lý...' : `Đồng ý ${selectedStaff.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            )}
        </Dialog>

        {/* MODAL Xác nhận Xóa */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            {selectedStaff && (
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle /> Xác nhận xóa vĩnh viễn
                        </DialogTitle>
                        <DialogDescription className="py-2">
                            Bạn có chắc chắn muốn xóa nhân viên <strong>{selectedStaff.full_name}</strong>? 
                            Hành động này <strong>không thể hoàn tác</strong> và dữ liệu nhân viên sẽ mất hoàn toàn.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Hủy</Button>
                        <Button 
                            variant="destructive"
                            className="cursor-pointer"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(selectedStaff.id)}
                        >
                            {deleteMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            )}
        </Dialog>

        </div>
    );
}