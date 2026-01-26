"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Camera, User } from "lucide-react";

// Firebase Imports
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase"; 

// Service & Store
import { userService } from "@/services/user.service";
import { useUserStore } from "@/hooks/useUserStore"; // Import Store

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Lấy hàm setUser từ store để cập nhật Header ngay lập tức
  const { setUser } = useUserStore(); 

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { full_name: "", shop_name: "", phone_number: "" }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await userService.getProfile();
        setValue("full_name", user.full_name);
        setValue("shop_name", user.shop_name || "");
        setValue("phone_number", user.phone_number);
        
        if (user.avatar && user.avatar.url) {
           setPreviewUrl(user.avatar.url);
        }
      } catch (error) {
        toast.error("Không thể tải thông tin cá nhân");
      }
    };
    fetchProfile();
  }, [setValue]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
      return;
    }

    setUploading(true);
    try {
      const fileName = `avatars/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setPreviewUrl(downloadURL);
      toast.success("Đã tải ảnh lên! Hãy nhấn Lưu để cập nhật.");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // 1. Gửi API cập nhật
      const res = await userService.updateProfile({
        full_name: data.full_name,
        shop_name: data.shop_name,
        avatar: previewUrl || undefined 
      });

      // 2. QUAN TRỌNG: Cập nhật Store để Header thay đổi Avatar ngay lập tức
      setUser(res.data);

      toast.success("Cập nhật hồ sơ thành công!");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi lưu hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Hồ Sơ Cá Nhân</CardTitle>
          <CardDescription>Quản lý thông tin hiển thị của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                  <AvatarImage src={previewUrl || ""} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-muted"><User className="w-12 h-12" /></AvatarFallback>
                </Avatar>
                <Label htmlFor="avatar-upload" className={`absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 shadow-sm ${uploading ? 'opacity-50' : ''}`}>
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                </Label>
                <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploading}/>
              </div>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Họ và tên</Label>
                <Input {...register("full_name", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input {...register("phone_number")} disabled className="bg-gray-100" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Tên cửa hàng</Label>
                <Input {...register("shop_name")} />
              </div>
            </div>

            <Button type="submit" disabled={loading || uploading}>
              {loading ? "Đang lưu..." : "Lưu Thay Đổi"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}