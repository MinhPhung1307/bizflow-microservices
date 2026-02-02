'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input'; // Import Input
import { Mic, MicOff, Sparkles, Loader2, Send, AlertCircle, FileText, User, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { productService } from '@/services/product.service';
import { customerService } from '@/services/customer.service'; // Import Customer Service
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea

// --- VISUALIZER ---
const AudioVisualizer = ({ isRecording }: { isRecording: boolean }) => {
  if (!isRecording) return null;
  return (
    <div className="flex items-center gap-1 h-5 px-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-1 bg-indigo-500 rounded-full animate-pulse"
           style={{ height: '60%', animationDuration: `${0.5 + i * 0.1}s`, animationIterationCount: 'infinite' }} />
      ))}
    </div>
  );
};

interface AIOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (items: any[], customer: any) => void; // Thêm customer vào callback
  onSaveDraft: (items: any[], customer: any) => void; // Thêm customer vào callback
}

export default function AIOrderDialog({ open, onOpenChange, onConfirm, onSaveDraft }: AIOrderDialogProps) {
  // --- STATE ---
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [draftItems, setDraftItems] = useState<any[]>([]); 
  const [productsCache, setProductsCache] = useState<any[]>([]);
  
  // State cho Khách hàng
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [foundCustomers, setFoundCustomers] = useState<any[]>([]);
  const [showCustomerList, setShowCustomerList] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // 1. Load Cache SP & Tìm khách hàng
  useEffect(() => {
    if (open && productsCache.length === 0) {
        productService.getAll({ limit: 2000 }).then((data: any) => {
            if (Array.isArray(data)) setProductsCache(data);
        }).catch(err => console.error("Lỗi tải SP cache:", err));
    }
  }, [open, productsCache]);

  // Logic tìm khách hàng khi gõ
  useEffect(() => {
    if (customerSearch.length > 1) {
        const timeout = setTimeout(() => {
            customerService.getCustomers(customerSearch).then(data => {
                setFoundCustomers(data);
                setShowCustomerList(true);
            });
        }, 300);
        return () => clearTimeout(timeout);
    } else {
        setFoundCustomers([]);
        setShowCustomerList(false);
    }
  }, [customerSearch]);

  // 2. Recording (Giữ nguyên)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await handleTranscribe(audioBlob); 
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { toast.error("Không thể truy cập Micro."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 3. Transcribe & Analyze (Cập nhật logic mapping)
  const handleTranscribe = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      const response = await api.post('/orders/ai/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setTranscript(prev => (prev ? prev + " " + response.data.text : response.data.text));
      }
    } catch (error) { toast.error("Lỗi xử lý giọng nói."); } 
    finally { setIsLoading(false); }
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;
    setIsLoading(true);
    try {
      const response = await api.post('/orders/ai/draft', { message: transcript });
      if (response.data.success && response.data.data?.items) {
        const aiItems = response.data.data.items;
        
        // --- Logic Map Sản Phẩm ---
        const syncedItems = aiItems.map((aiItem: any) => {
            const matched = productsCache.find(p => 
                p.id === aiItem.product_id || 
                p.name.toLowerCase().includes(aiItem.product_name.toLowerCase())
            );
            if (matched) {
                return {
                    product_id: matched.id,
                    product_name: matched.name,
                    quantity: aiItem.quantity || 1,
                    unit: matched.unit || 'cái',
                    price: Number(matched.price_sales || matched.price),
                    stock: matched.stock || matched.stock_quantity || 0,
                    found: true,
                    image: matched.image_url
                };
            }
            return { ...aiItem, product_name: aiItem.product_name, found: false, price: 0, stock: 0 };
        });
        setDraftItems(syncedItems);

        // --- Logic Map Khách hàng (Nếu AI trả về tên khách) ---
        if (response.data.data.customer_name) {
            const aiCusName = response.data.data.customer_name;
            
            // 1. Điền ngay tên AI đoán được vào ô tìm kiếm để nhân viên thấy
            setCustomerSearch(aiCusName); 

            // 2. Tự động gọi API tìm xem tên này có trong DB không
            const customers = await customerService.getCustomers(aiCusName);
            
            if (customers.length > 0) {
                // Nếu có: Chọn luôn người đầu tiên (nhưng nhân viên vẫn có thể bấm nút X để chọn lại)
                setSelectedCustomer(customers[0]); 
                toast.info(`Đã tìm thấy khách hàng: ${customers[0].full_name}`);
            } else {
                // Nếu không có trong DB: Chỉ hiện text để nhân viên biết AI nghe được tên gì
                // Nhân viên sẽ tự quyết định tạo mới hoặc sửa lại từ khóa tìm kiếm
                toast.warning(`AI nghe thấy tên "${aiCusName}" nhưng chưa có trong hệ thống.`);
            }
        }
        if (syncedItems.length === 0) toast.warning("AI không tìm thấy sản phẩm nào.");
      }
    } catch (error) { toast.error("Lỗi phân tích đơn hàng."); } 
    finally { setIsLoading(false); }
  };

  // 4. Edit Logic (Mới)
  const updateQuantity = (index: number, newQty: number) => {
    const newItems = [...draftItems];
    newItems[index].quantity = newQty;
    setDraftItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...draftItems];
    newItems.splice(index, 1);
    setDraftItems(newItems);
  };

  // 5. Actions
  const handleConfirmOrder = () => {
    const validItems = draftItems.filter(i => i.found && i.quantity > 0);
    if (validItems.length === 0) return toast.error("Không có sản phẩm hợp lệ.");
    onConfirm(validItems, selectedCustomer);
    resetAndClose();
  };

  const handleSaveToDraft = () => {
    const validItems = draftItems.filter(i => i.found && i.quantity > 0);
    if (validItems.length === 0) return toast.error("Không có sản phẩm hợp lệ.");
    onSaveDraft(validItems, selectedCustomer);
    resetAndClose();
  };

  const resetAndClose = () => {
    setTranscript("");
    setDraftItems([]);
    setSelectedCustomer(null);
    setCustomerSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-600">
            <Sparkles size={20} /> Trợ lý AI (F8)
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-2">
            {/* INPUT & RECORDER */}
            <div className="relative">
                <Textarea 
                placeholder="Ví dụ: Lấy 5 bao xi măng cho anh Hùng..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="min-h-[60px] pr-12 text-base resize-none"
                disabled={isLoading}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAnalyze();
                    }
                }}
                />
                <div className="absolute bottom-2 right-2 flex gap-2 items-center">
                    <AudioVisualizer isRecording={isRecording} />
                    <Button 
                        variant="ghost" size="icon" 
                        className={`rounded-full h-8 w-8 ${isRecording ? 'bg-red-100 text-red-600' : 'text-slate-400'}`}
                        onClick={isRecording ? stopRecording : startRecording}
                    >
                        {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                    </Button>
                </div>
            </div>

            {/* AI CONTROLS */}
            <div className="flex gap-2">
                 {/* CUSTOMER SELECTION - MỚI */}
                <div className="relative flex-1">
                    <div className="flex items-center border rounded-md px-3 bg-white focus-within:ring-2 ring-indigo-100">
                        <User size={16} className="text-slate-400 mr-2" />
                        <Input 
                            className="border-none shadow-none focus-visible:ring-0 p-0 h-9"
                            placeholder="Chọn khách hàng (AI tự điền hoặc tìm)..."
                            value={customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                if(selectedCustomer) setSelectedCustomer(null); // Reset nếu gõ lại
                            }}
                        />
                        {selectedCustomer && (
                             <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-600" onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}>
                                 <User size={14} />
                             </Button>
                        )}
                    </div>
                    {/* DROPDOWN CUSTOMER */}
                    {showCustomerList && foundCustomers.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border shadow-lg rounded-md mt-1 z-50 max-h-40 overflow-y-auto">
                            {foundCustomers.map(cus => (
                                <div 
                                    key={cus.id} 
                                    className="p-2 hover:bg-slate-50 cursor-pointer text-sm"
                                    onClick={() => {
                                        setSelectedCustomer(cus);
                                        setCustomerSearch(cus.full_name);
                                        setShowCustomerList(false);
                                    }}
                                >
                                    <div className="font-medium">{cus.full_name}</div>
                                    <div className="text-xs text-slate-500">{cus.phone_number}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Button onClick={handleAnalyze} disabled={isLoading || !transcript.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Phân tích
                </Button>
            </div>
        </div>

        {/* EDITABLE TABLE - MỚI */}
        {draftItems.length > 0 && (
            <div className="flex-1 overflow-y-auto border rounded-md">
                <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                        <TableRow>
                            <TableHead>Sản phẩm</TableHead>
                            <TableHead className="w-20 text-center">SL</TableHead>
                            <TableHead className="text-right">Đơn giá</TableHead>
                            <TableHead className="w-8"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {draftItems.map((item, idx) => (
                            <TableRow key={idx} className={!item.found ? 'bg-red-50' : ''}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className={item.found ? "font-medium" : "text-red-600"}>{item.product_name}</span>
                                        {!item.found && <span className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Không có trong kho</span>}
                                    </div>
                                </TableCell>
                                <TableCell className="p-1">
                                    {item.found ? (
                                        <Input 
                                            type="number" 
                                            className="h-8 w-20 text-center mx-auto"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(idx, Number(e.target.value))}
                                            min={1}
                                        />
                                    ) : (
                                        <div className="text-center text-slate-400">-</div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => removeItem(idx)}>
                                        <X size={16} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )}

        <DialogFooter className="mt-2 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
            
            {draftItems.length > 0 && (
                <>
                    <Button 
                        variant="secondary" 
                        onClick={handleSaveToDraft}
                        className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200"
                    >
                        <FileText className="mr-2 h-4 w-4" /> Lưu nháp (Tại đây)
                    </Button>

                    <Button onClick={handleConfirmOrder} className="bg-green-600 hover:bg-green-700">
                        Thêm vào giỏ
                    </Button>
                </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}