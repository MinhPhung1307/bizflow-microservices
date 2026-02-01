"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ownerService } from "@/services/owner.service";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, History, Eye, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// 1. Định nghĩa kiểu dữ liệu cho Nhật ký (Type Safety)
interface AuditLog {
  id: string;
  user_name: string;
  role_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: any;
  new_value: any;
  created_at: string;
}

export default function AuditLogsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [isClearAllOpen, setIsClearAllOpen] = useState(false);
  const [logIdToDelete, setLogIdToDelete] = useState<string | null>(null);

  // Fetch dữ liệu nhật ký
  const {
    data: logs = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["audit-logs", searchTerm],
    queryFn: () => ownerService.getAuditLogs(searchTerm),
    enabled: typeof window !== "undefined",
  });

  // Hàm xác định màu sắc Badge
  const getActionBadge = (action: string) => {
    const a = action?.toUpperCase() || "";
    if (a.includes("CREATE") || a.includes("TẠO") || a.includes("NHẬP"))
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">
          Tạo mới
        </Badge>
      );
    if (a.includes("UPDATE") || a.includes("SỬA") || a.includes("CẬP NHẬT"))
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">
          Cập nhật
        </Badge>
      );
    if (a.includes("DELETE") || a.includes("XÓA"))
      return <Badge variant="destructive">Xóa</Badge>;
    if (a.includes("LOGIN") || a.includes("PASSWORD") || a.includes("LOCK"))
      return (
        <Badge
          variant="outline"
          className="text-amber-600 border-amber-600 bg-amber-50"
        >
          Bảo mật
        </Badge>
      );

    return <Badge variant="secondary">{action}</Badge>;
  };

  // Mutation: Xóa tất cả nhật ký
  const clearLogsMutation = useMutation({
    mutationFn: () => ownerService.clearAuditLogs(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      toast.success("Đã xóa sạch nhật ký hoạt động");
      setIsClearAllOpen(false);
    },
    onError: () => toast.error("Không thể xóa nhật ký"),
  });

  // Mutation: Xóa 1 bản ghi
  const deleteLogMutation = useMutation({
    mutationFn: (id: string) => ownerService.deleteAuditLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      toast.success("Đã xóa bản ghi nhật ký");
      setLogIdToDelete(null);
    },
    onError: () => toast.error("Lỗi khi xóa bản ghi"),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Nhật Ký Hoạt Động
          </h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi thay đổi hệ thống và truy vết trách nhiệm.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Làm mới dữ liệu"
            aria-label="Làm mới dữ liệu"
            className={cn(
              "p-3 bg-blue-50 text-blue-600 rounded-full shadow-sm hover:bg-blue-100 transition-all cursor-pointer border-none outline-none active:scale-95",
              isFetching && "opacity-70 cursor-not-allowed",
            )}
          >
            <History
              size={24}
              className={cn(isFetching && "animate-spin")}
              style={{ animationDirection: "reverse" }}
            />
          </button>
          <button
            onClick={() => setIsClearAllOpen(true)}
            disabled={clearLogsMutation.isPending || logs.length === 0}
            title="Xóa tất cả nhật ký"
            aria-label="Xóa tất cả nhật ký"
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
            Xóa tất cả
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <Input
          placeholder="Tìm nhân viên, hành động hoặc đối tượng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          aria-label="Tìm kiếm nhật ký"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 w-[180px]">
                  Thời Gian
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Người Thực Hiện
                </th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700">
                  Hành Động
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Chi Tiết
                </th>
                <th className="px-6 py-4 text-center w-[120px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-gray-500 italic"
                  >
                    {searchTerm
                      ? "Không tìm thấy kết quả phù hợp."
                      : "Chưa có hoạt động nào được ghi lại."}
                  </td>
                </tr>
              ) : (
                logs.map((log: AuditLog) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-500 font-medium whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">
                        {log.user_name}
                      </div>
                      <div className="text-[10px] text-blue-500 font-black uppercase tracking-wider">
                        {log.role_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="font-medium text-gray-700 truncate max-w-[200px]"
                        title={`${log.action} trên ${log.entity_type}`}
                      >
                        {log.action} : {log.entity_type}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5 italic">
                        ID: {log.entity_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* --- NÚT XEM CHI TIẾT (Đã fix lỗi A11y) --- */}
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer rounded-md hover:bg-blue-50"
                          title="Xem chi tiết"
                          aria-label={`Xem chi tiết nhật ký của ${log.user_name}`}
                        >
                          <Eye size={18} />
                        </button>

                        {/* --- NÚT XÓA BẢN GHI (Đã fix lỗi A11y) --- */}
                        <button
                          onClick={() => setLogIdToDelete(log.id)}
                          disabled={deleteLogMutation.isPending}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer rounded-md hover:bg-red-50 disabled:opacity-50"
                          title="Xóa bản ghi"
                          aria-label={`Xóa nhật ký ID ${log.id}`}
                        >
                          <Trash2 size={18} />
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

      {/* --- MODAL XEM CHI TIẾT --- */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-5xl w-[95vw] overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              Chi tiết thay đổi dữ liệu
              {selectedLog && getActionBadge(selectedLog.action)}
            </DialogTitle>
            <DialogDescription>
              So sánh giá trị cũ và giá trị mới của thực thể:{" "}
              <span className="font-mono font-bold text-blue-600">
                {selectedLog?.entity_type}
              </span>{" "}
              (ID: {selectedLog?.entity_id})
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 overflow-y-auto pr-2 pb-2">
            {/* Cột giá trị cũ */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-red-700 uppercase">
                  Giá trị cũ
                </h4>
                <Badge
                  variant="outline"
                  className="text-red-500 border-red-200 bg-red-50"
                >
                  Trước khi sửa
                </Badge>
              </div>
              <div className="p-4 bg-red-50/50 rounded-lg border border-red-100 flex-1 relative group">
                <pre className="text-[12px] font-mono overflow-auto max-h-[50vh] text-red-600 leading-relaxed whitespace-pre-wrap">
                  {selectedLog?.old_value ? (
                    JSON.stringify(selectedLog.old_value, null, 2)
                  ) : (
                    <span className="text-gray-400 italic">
                      // Không có dữ liệu cũ (Tạo mới hoặc không ghi nhận)
                    </span>
                  )}
                </pre>
              </div>
            </div>

            {/* Cột giá trị mới */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-green-700 uppercase">
                  Giá trị mới
                </h4>
                <Badge
                  variant="outline"
                  className="text-green-500 border-green-200 bg-green-50"
                >
                  Sau khi sửa
                </Badge>
              </div>
              <div className="p-4 bg-green-50/50 rounded-lg border border-green-100 flex-1">
                <pre className="text-[12px] font-mono overflow-auto max-h-[50vh] text-green-700 leading-relaxed whitespace-pre-wrap">
                  {selectedLog?.new_value ? (
                    JSON.stringify(selectedLog.new_value, null, 2)
                  ) : (
                    <span className="text-gray-400 italic">
                      // Không có dữ liệu mới (Xóa hoặc không ghi nhận)
                    </span>
                  )}
                </pre>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSelectedLog(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL XÁC NHẬN XÓA TẤT CẢ --- */}
      <Dialog open={isClearAllOpen} onOpenChange={setIsClearAllOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-xl">
              Xác nhận xóa toàn bộ?
            </DialogTitle>
            <DialogDescription className="text-center">
              Hành động này sẽ xóa vĩnh viễn tất cả nhật ký hiện có. <br />
              <span className="font-bold text-red-500">
                Bạn không thể hoàn tác sau khi thực hiện.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-center gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsClearAllOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => clearLogsMutation.mutate()}
              disabled={clearLogsMutation.isPending}
            >
              {clearLogsMutation.isPending ? "Đang xóa..." : "Xác nhận xóa hết"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL XÁC NHẬN XÓA TỪNG BẢN GHI --- */}
      <Dialog
        open={!!logIdToDelete}
        onOpenChange={() => setLogIdToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa bản ghi nhật ký?</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bản ghi này khỏi hệ thống không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setLogIdToDelete(null)}>
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                logIdToDelete && deleteLogMutation.mutate(logIdToDelete)
              }
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
