"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ownerService } from "@/services/owner.service";
import { toast } from "sonner";
import { MessageSquarePlus, Send } from "lucide-react";

// Schema validation
const feedbackSchema = z.object({
  title: z.string().min(5, "Tiêu đề quá ngắn"),
  content: z.string().min(10, "Nội dung cần chi tiết hơn một chút"),
});

export function FeedbackFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { title: "", content: "" },
  });

  async function onSubmit(values: z.infer<typeof feedbackSchema>) {
    try {
      await ownerService.sendFeedback(values);
      toast.success("Cảm ơn bạn! Phản hồi đã được gửi tới Admin.");
      form.reset();
      setIsOpen(false); // Đóng modal sau khi gửi
    } catch (error) {
      toast.error("Gửi phản hồi thất bại. Vui lòng thử lại.");
    }
  }

  return (
    <>
      {/* Nút bấm nổi ở góc phải màn hình */}
      <button
        onClick={() => setIsOpen(true)}
        className="cursor-pointer fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:scale-110 hover:bg-blue-700 active:scale-95 shadow-blue-500/40"
        title="Góp ý & Báo lỗi"
      >
        <MessageSquarePlus className="h-6 w-6" />
        
        <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20 pointer-events-none"></span>
      </button>

      {/* Modal nhập liệu (Dialog) */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white border-none shadow-2xl rounded-xl p-0 overflow-hidden">
          {/* Header với dải màu xanh nhạt tạo điểm nhấn */}
          <div className="bg-blue-50/50 px-6 py-4 border-b border-blue-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-blue-900 text-xl font-bold">
                <div className="p-2 bg-blue-500 rounded-lg text-white">
                  <MessageSquarePlus className="h-5 w-5" />
                </div>
                Góp ý & Báo lỗi
              </DialogTitle>
              <DialogDescription className="text-blue-700/70 pt-1">
                Ý kiến của bạn giúp chúng tôi hoàn thiện BizFlow mỗi ngày.
              </DialogDescription>
            </DialogHeader>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-4 space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Chủ đề</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ví dụ: Góp ý giao diện, Báo lỗi in hóa đơn..." 
                        {...field} 
                        className="bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Nội dung chi tiết</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Bạn gặp khó khăn gì hoặc muốn chúng tôi cải thiện điều gì?" 
                        className="min-h-[140px] bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-2 pb-2 gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:bg-gray-100 font-medium"
                >
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md shadow-blue-200 flex gap-2"
                >
                  {form.formState.isSubmitting ? (
                    "Đang gửi..."
                  ) : (
                    <>
                      Gửi góp ý <Send className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}