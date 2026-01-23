'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ownerService } from '@/services/owner.service';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, History, Eye, Trash2, AlertTriangle } from 'lucide-react';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AuditLogsPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const [isClearAllOpen, setIsClearAllOpen] = useState(false);
    const [logIdToDelete, setLogIdToDelete] = useState<string | null>(null);

    // Fetch dữ liệu nhật ký thực tế
    const { data: logs = [], isLoading, refetch, isFetching } = useQuery({
        queryKey: ['audit-logs', searchTerm],
        queryFn: () => ownerService.getAuditLogs(searchTerm),
        enabled: typeof window !== 'undefined',
    });

    // Hàm xác định màu sắc cho Badge dựa trên hành động (khớp với model AuditLog)
    const getActionBadge = (action: string) => {
        const a = action.toUpperCase();
        if (a.includes('CREATE') || a.includes('NHẬP')) return <Badge variant="success">Tạo mới</Badge>;
        if (a.includes('UPDATE') || a.includes('SỬA')) return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Cập nhật</Badge>;
        if (a.includes('DELETE') || a.includes('XÓA')) return <Badge variant="destructive">Xóa</Badge>;
        if (a.includes('PASSWORD') || a.includes('LOCK')) return <Badge variant="outline" className="text-amber-600 border-amber-600">Bảo mật</Badge>;
        return <Badge variant="secondary">{action}</Badge>;
    };

    const clearLogsMutation = useMutation({
        mutationFn: () => ownerService.clearAuditLogs(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
            toast.success('Đã xóa sạch nhật ký hoạt động');
            setIsClearAllOpen(false);
        },
        onError: () => toast.error('Không thể xóa nhật ký')
    });

    const deleteLogMutation = useMutation({
        mutationFn: (id: string) => ownerService.deleteAuditLog(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
            toast.success('Đã xóa bản ghi nhật ký');
            setLogIdToDelete(null);
        },
        onError: () => toast.error('Lỗi khi xóa bản ghi')
    });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Nhật Ký Hoạt Động</h1>
                    <p className="text-muted-foreground mt-1">Theo dõi thay đổi hệ thống và truy vết trách nhiệm trong 30 ngày.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => refetch()}
                        disabled={isFetching}
                        title="Làm mới dữ liệu"
                        className={cn(
                            "p-3 bg-blue-50 text-blue-600 rounded-full shadow-sm hover:bg-blue-100 transition-all cursor-pointer border-none outline-none active:scale-95",
                            isFetching && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        <History 
                            size={28} 
                            className={cn(isFetching && "animate-spin")}
                        />
                    </button>
                    <button 
                        onClick={() => setIsClearAllOpen(true)}
                        disabled={clearLogsMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all text-sm font-medium cursor-pointer"
                    >
                        <Trash2 size={16} />
                        Xóa tất cả
                    </button>
                </div>
            </div>

            {/* Bộ lọc tìm kiếm */}
            <div className="mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input 
                        placeholder="Tìm nhân viên hoặc hành động..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Bảng hiển thị đồng bộ shadow và border */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700 w-[180px]">Thời Gian</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Người Thực Hiện</th>
                            <th className="px-6 py-4 text-center font-semibold text-gray-700">Hành Động</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Chi Tiết</th> 
                            <th className="px-6 py-4 text-center w-[120px]">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">Đang tải nhật ký...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">Chưa có hoạt động nào được ghi lại.</td></tr>
                        ) : (
                            logs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                        {new Date(log.created_at).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{log.user_name}</div>
                                        <div className="text-[10px] text-blue-500 font-black uppercase tracking-wider">
                                            {log.role_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {getActionBadge(log.action)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-700">{log.action} trên bảng {log.entity_type} </div>
                                        <div className="text-[11px] text-gray-400 font-mono mt-0.5 italic">
                                            {log.entity_type} ID: {log.entity_id}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => setSelectedLog(log)}
                                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button 
                                            onClick={() => setLogIdToDelete(log.id)}
                                            disabled={deleteLogMutation.isPending}
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                                            title="Xóa bản ghi"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal xem chi tiết thay đổi  */}
            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="max-w-5xl w-[95vw] overflow-hidden flex flex-col max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Chi tiết thay đổi dữ liệu</DialogTitle>
                        <DialogDescription>
                            So sánh giá trị cũ và giá trị mới của thực thể: <span className="font-mono font-bold text-blue-600">{selectedLog?.entity_type}</span> (ID: {selectedLog?.entity_id})
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 overflow-y-auto pr-2">
                        {/* Cột giá trị cũ */}
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-red-700 uppercase">Giá trị cũ</h4>
                                <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Trước khi sửa</Badge>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex-1">
                                <pre className="text-[12px] font-mono overflow-auto max-h-[60vh] text-red-600 leading-relaxed">
                                    {JSON.stringify(selectedLog?.old_value, null, 2) || '// Không có dữ liệu cũ'}
                                </pre>
                            </div>
                        </div>

                        {/* Cột giá trị mới */}
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-green-700 uppercase">Giá trị mới</h4>
                                <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">Sau khi sửa</Badge>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100 flex-1">
                                <pre className="text-[12px] font-mono overflow-auto max-h-[60vh] text-green-700 leading-relaxed">
                                    {JSON.stringify(selectedLog?.new_value, null, 2) || '// Không có dữ liệu mới'}
                                </pre>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* 1. DIALOG XÁC NHẬN XÓA TẤT CẢ */}
            <Dialog open={isClearAllOpen} onOpenChange={setIsClearAllOpen}>
                <DialogContent>
                    <DialogHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-center text-xl">Xác nhận xóa toàn bộ?</DialogTitle>
                        <DialogDescription className="text-center">
                            Hành động này sẽ xóa vĩnh viễn tất cả nhật ký hiện có. Bạn không thể hoàn tác sau khi thực hiện.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex sm:justify-center gap-2 mt-4">
                        <Button variant="outline" onClick={() => setIsClearAllOpen(false)}>Hủy</Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => clearLogsMutation.mutate()}
                            disabled={clearLogsMutation.isPending}
                            className="cursor-pointer"
                        >
                            {clearLogsMutation.isPending ? "Đang xóa..." : "Xác nhận xóa hết"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2. DIALOG XÁC NHẬN XÓA TỪNG BẢN GHI */}
            <Dialog open={!!logIdToDelete} onOpenChange={() => setLogIdToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa bản ghi nhật ký?</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa bản ghi này khỏi hệ thống không?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setLogIdToDelete(null)}>Hủy bỏ</Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => logIdToDelete && deleteLogMutation.mutate(logIdToDelete)}
                            disabled={deleteLogMutation.isPending}
                        >
                            {deleteLogMutation.isPending ? "Đang xử lý..." : "Xóa bản ghi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}