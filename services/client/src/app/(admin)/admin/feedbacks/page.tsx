"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MessageSquare, CheckCircle2, Clock } from "lucide-react";

export default function AdminFeedbackPage() {
  const queryClient = useQueryClient();
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 1. Lấy danh sách feedback
  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ["admin", "feedbacks"],
    queryFn: () => adminService.getFeedbacks(),
  });

  // 2. Mutation để cập nhật trạng thái
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      adminService.updateFeedback(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "feedbacks"] });
      toast.success("Đã cập nhật trạng thái phản hồi");
      setIsDialogOpen(false);
      setSelectedFeedback(null);
      setAdminNote("");
    },
    onError: () => toast.error("Có lỗi xảy ra khi cập nhật"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteFeedback(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "feedbacks"] });
      // Nếu có dùng badge số lượng ở sidebar, hãy invalidate cả nó
      queryClient.invalidateQueries({ queryKey: ["admin", "feedback-count"] });
      toast.success("Đã xóa phản hồi vĩnh viễn");
    },
    onError: () => toast.error("Không thể xóa phản hồi này"),
  });

  const handleOpenDialog = (feedback: any) => {
    setSelectedFeedback(feedback);
    setAdminNote(feedback.admin_note || "");
    setIsDialogOpen(true);
  };

  const handleProcessFeedback = () => {
    if (!selectedFeedback) return;
    updateMutation.mutate({
      id: selectedFeedback.id,
      data: {
        status: "PROCESSED",
        admin_note: adminNote,
      },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa phản hồi này không? Hành động này không thể hoàn tác.")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Phản hồi</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Danh sách ý kiến từ chủ cửa hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Cửa hàng</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Đang tải...</TableCell></TableRow>
              ) : feedbacks?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center">Chưa có phản hồi nào</TableCell></TableRow>
              ) : (
                feedbacks?.map((fb: any) => (
                  <TableRow key={fb.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(fb.created_at).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{fb.shop_name}</div>
                      <div className="text-xs text-muted-foreground">{fb.full_name}</div>
                    </TableCell>
                    <TableCell className="font-medium">{fb.title}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{fb.content}</TableCell>
                    <TableCell>
                      {fb.status === "PENDING" ? (
                        <Badge variant="outline" className="flex w-fit items-center gap-1 text-yellow-600 border-yellow-200">
                          <Clock className="h-3 w-3" /> Chờ xử lý
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex w-fit items-center gap-1 text-green-600 border-green-200">
                          <CheckCircle2 className="h-3 w-3" /> Đã xử lý
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleOpenDialog(fb)}
                      >
                        {fb.status === "PENDING" ? "Xử lý" : "Xem chi tiết"}
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(fb.id)}
                        disabled={deleteMutation.isPending}
                      >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Xử lý Phản hồi */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chi tiết phản hồi</DialogTitle>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-bold">Nội dung:</Label>
                <p className="col-span-3 text-sm bg-muted p-3 rounded-md italic">
                  "{selectedFeedback.content}"
                </p>
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="note" className="text-right font-bold mt-2">
                  Ghi chú Admin:
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="note"
                    placeholder="Nhập hướng giải quyết hoặc phản hồi cho chủ cửa hàng..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Đóng
            </Button>
            {selectedFeedback?.status === "PENDING" && (
              <Button 
                onClick={handleProcessFeedback}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Đang lưu..." : "Đánh dấu đã xử lý"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}