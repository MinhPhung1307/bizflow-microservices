"use client";

import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { storage } from "@/lib/firebase"; // Đảm bảo bạn đã export storage từ file firebase.ts
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Edit, ExternalLink, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ReportConfigPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tempUrl, setTempUrl] = useState(""); // State để giữ URL sau khi upload

  // 1. Fetch danh sách mẫu biểu
  const { data: templates, isLoading } = useQuery({
    queryKey: ["admin", "report-templates"],
    queryFn: () => adminService.getReportTemplates(),
  });

  // 2. Mutation cập nhật dữ liệu vào Backend
  const updateMutation = useMutation({
    mutationFn: (data: any) => adminService.updateReportTemplate(selectedTemplate.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "report-templates"] });
      toast.success("Cập nhật mẫu báo cáo thành công");
      setIsEditOpen(false);
    },
    onError: () => toast.error("Lỗi khi cập nhật mẫu biểu")
  });

  // 3. Xử lý Upload file lên Firebase
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Chỉ cho phép file Excel
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!isExcel) {
      toast.error("Vui lòng chỉ tải lên định dạng file Excel (.xlsx, .xls)");
      return;
    }

    setIsUploading(true);
    const storageRef = ref(storage, `report-templates/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      null,
      (error) => {
        console.error("Upload error:", error);
        toast.error("Lỗi khi tải file lên Firebase");
        setIsUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setTempUrl(downloadURL); // Cập nhật URL vào state để hiển thị trong Input
        toast.success("Tải file lên thành công!");
        setIsUploading(false);
      }
    );
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setTempUrl(template.template_url || ""); // Load URL cũ vào state
    setIsEditOpen(true);
  };

  const onUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const data = {
        report_name: formData.get("report_name"),
        template_url: tempUrl, // Sử dụng URL từ state (đã upload)
        config_json: JSON.parse(formData.get("config_json") as string || "{}"),
      };
      updateMutation.mutate(data);
    } catch (err) {
      toast.error("Định dạng JSON mapping không hợp lệ");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quản lý Mẫu biểu</h1>
          <p className="text-muted-foreground">Cấu hình các loại sổ kế toán theo Thông tư 88/2021/TT-BTC</p>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Danh mục sổ kế toán hộ kinh doanh
          </CardTitle>
          <CardDescription>Các mẫu sổ này sẽ được hệ thống tự động điền dữ liệu (Auto-fill)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/30">
                <TableHead className="w-[120px]">Mã hiệu</TableHead>
                <TableHead>Tên loại sổ / Báo cáo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Cập nhật cuối</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10">Đang tải cấu hình...</TableCell></TableRow>
              ) : templates?.map((tpl: any) => (
                <TableRow key={tpl.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-bold text-blue-700">{tpl.report_code}</TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{tpl.report_name}</div>
                    {tpl.template_url && (
                      <a href={tpl.template_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 flex items-center gap-1 hover:underline mt-1">
                        <ExternalLink className="h-3 w-3" /> Xem file mẫu hiện tại
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tpl.is_active ? "default" : "secondary"} className={tpl.is_active ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                      {tpl.is_active ? "Đang áp dụng" : "Ngừng dùng"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {new Date(tpl.updated_at).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(tpl)} className="border-slate-200 hover:bg-blue-50 hover:text-blue-700">
                      <Edit className="h-4 w-4 mr-1" /> Cấu hình
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Cấu hình Mẫu biểu {selectedTemplate?.report_code}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên báo cáo</Label>
              <Input name="report_name" defaultValue={selectedTemplate?.report_name} required />
            </div>
            
            <div className="space-y-2">
              <Label>Đường dẫn File mẫu (.xlsx)</Label>
              <div className="flex gap-2">
                <Input 
                  value={tempUrl} 
                  onChange={(e) => setTempUrl(e.target.value)} 
                  placeholder="https://firebasestorage.googleapis.com/..." 
                />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".xlsx, .xls"
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-slate-500 italic">Hệ thống khuyến khích sử dụng link từ Firebase Storage để đảm bảo tính ổn định.</p>
            </div>

            <div className="space-y-2">
              <Label>Mapping Biến số (JSON Config)</Label>
              <textarea 
                name="config_json"
                className="w-full min-h-[150px] p-3 text-xs font-mono bg-slate-950 text-green-400 rounded-md border border-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                defaultValue={JSON.stringify(selectedTemplate?.config_json, null, 2)}
              />
              <p className="text-[10px] text-slate-500 italic">* Định nghĩa vị trí các ô Excel cần điền dữ liệu (Ví dụ: "total_cell": "G20")</p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Hủy</Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700" 
                disabled={updateMutation.isPending || isUploading}
              >
                {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}