import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import { orderService } from '@/services/order.service';
import { productService } from '@/services/product.service';
import { customerService } from '@/services/customer.service';
import { toast } from 'sonner';
import { 
  Bot, AlertCircle, Loader2, Mic, MicOff, 
  Trash2, Plus, Send, Sparkles, Search, CheckCircle,
  CreditCard, Banknote, User, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- HELPER: Kiểm tra đơn vị có cho phép số lẻ không ---
const isDecimalUnit = (unit) => {
  if (!unit) return false;
  const lower = unit.toLowerCase().trim();
  // Các đơn vị đo lường liên tục cho phép số lẻ
  const decimalUnits = ['kg', 'g', 'gram', 'l', 'lít', 'm', 'mét', 'cm', 'm2', 'm3', 'tấn', 'tạ', 'yến'];
  return decimalUnits.includes(lower);
};

// --- COMPONENT SÓNG ÂM ---
const AudioVisualizer = ({ isRecording }) => {
  if (!isRecording) return null;
  return (
    <div className="flex items-center gap-1 h-5 px-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-1 bg-white rounded-full animate-pulse"
           style={{ height: '60%', animationDuration: `${0.5 + i * 0.1}s`, animationIterationCount: 'infinite' }} />
      ))}
    </div>
  );
};

const AIOrderCreator = ({ onSuccess = () => {} }) => {
  // --- STATE ---
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [orderItems, setOrderItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null); 
  const [customerSearchQuery, setCustomerSearchQuery] = useState(""); 
  const [paymentMethod, setPaymentMethod] = useState("cash"); 

  // Data cache
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableCustomers, setAvailableCustomers] = useState([]);

  // Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState(null); 
  const [modalSearch, setModalSearch] = useState(""); 

  const mediaRecorderRef = useRef(null);

  // --- 1. LOAD DATA (ĐÃ SỬA LỖI) ---
  useEffect(() => {
    const fetchData = async () => {
        try {
            // SỬA: productService.getAll trả về mảng luôn, không cần .data
            const products = await productService.getAll({ limit: 1000 });
            if (Array.isArray(products)) {
                setAvailableProducts(products);
            }

            // Load khách hàng
            const customers = await customerService.getCustomers();
            if (Array.isArray(customers)) {
                // Map lại field name cho khớp logic
                setAvailableCustomers(customers.map(c => ({...c, name: c.full_name})));
            }
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            toast.error("Không thể tải danh sách sản phẩm/khách hàng");
        }
    };
    fetchData();
  }, []);

  // --- 2. LOGIC GHI ÂM ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await handleTranscribe(audioBlob); 
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { toast.error("Lỗi Micro"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribe = async (audioBlob) => {
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
    } catch { toast.error("Lỗi xử lý giọng nói"); } finally { setIsLoading(false); }
  };

  // --- 3. PHÂN TÍCH AI ---
  const handleAnalyzeOrder = async () => {
    if (!transcript.trim()) return toast.warning("Vui lòng nhập nội dung");
    setIsLoading(true);
    try {
        const response = await api.post('/orders/ai/draft', { message: transcript });
        if (response.data.success) {
            const { items, customer, is_debt } = response.data.data;
            
            // Map sản phẩm
            const syncedItems = items.map(aiItem => {
                const matched = availableProducts.find(p => p.id === aiItem.product_id) || 
                                availableProducts.find(p => p.name === aiItem.product_name);
                if (matched) return createOrderItemFromProduct(matched, aiItem.quantity);
                return { ...aiItem, found: false, stock_available: 0 };
            });

            setOrderItems(syncedItems);

            // Map khách hàng
            if (customer && customer.id) {
                const localCustomer = availableCustomers.find(c => c.id === customer.id) || customer;
                setSelectedCustomer(localCustomer);
            } else if (customer && customer.name) {
                setCustomerSearchQuery(customer.name);
                setSelectedCustomer(null);
            }

            setPaymentMethod(is_debt ? 'debt' : 'cash');
            toast.success("Phân tích xong!");
        } else {
            toast.error("Không hiểu ý định");
        }
    } catch { toast.error("Lỗi kết nối AI"); } finally { setIsLoading(false); }
  };

  // --- 4. XỬ LÝ SẢN PHẨM ---
  
  const createOrderItemFromProduct = (product, qty = 1) => ({
    found: true,
    product_id: product.id,
    product_name: product.name,
    stock_available: product.stock,
    price: Number(product.price),
    unit: product.unit || 'cái',
    quantity: qty,
    total: Number(product.price) * qty,
    image: product.image // [Mới] Thêm ảnh để hiển thị trong bảng
  });

  const addItem = () => {
    setEditingRowIndex(orderItems.length); // Đánh dấu là đang thêm dòng mới
    setModalSearch("");
    setIsProductModalOpen(true); // Mở Modal chọn ngay
  };

  const removeItem = (index) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  const handleProductSelect = (product) => {
    const newItems = [...orderItems];
    
    // Nếu đang sửa dòng cũ thì giữ lại số lượng cũ, nếu thêm mới thì mặc định 1
    const currentQty = editingRowIndex < newItems.length ? newItems[editingRowIndex].quantity : 1;
    
    const newItem = createOrderItemFromProduct(product, currentQty);

    if (editingRowIndex >= newItems.length) {
        newItems.push(newItem);
    } else {
        newItems[editingRowIndex] = newItem;
    }
    
    setOrderItems(newItems);
    setIsProductModalOpen(false);
    setEditingRowIndex(null);
  };

  const handleQuantityChange = (index, value) => {
    const newItems = [...orderItems];
    const item = newItems[index];
    
    let qty = parseFloat(value);
    
    // VALIDATE SỐ LƯỢNG: Nếu đơn vị không cho phép lẻ -> làm tròn xuống
    if (!isDecimalUnit(item.unit)) {
        qty = Math.floor(qty); 
    }

    if (isNaN(qty) || qty < 0) qty = 0;

    item.quantity = qty;
    item.total = item.price * qty;
    
    newItems[index] = item;
    setOrderItems(newItems);
  };

  // --- 5. TẠO ĐƠN HÀNG ---
  const handleCreateOrder = async () => {
    if (orderItems.length === 0) return toast.warning("Đơn hàng trống!");
    if (orderItems.some(i => !i.found)) return toast.error("Vui lòng chọn sản phẩm cho các dòng lỗi!");

    try {
        const payload = {
            customer_id: selectedCustomer?.id || null,
            customer_name: selectedCustomer?.name || customerSearchQuery || "Khách lẻ",
            is_debt: paymentMethod === 'debt',
            payment_method: paymentMethod, 
            items: orderItems.map(i => ({
                product_id: i.product_id,
                quantity: i.quantity,
                price: i.price
            })),
            total_amount: orderItems.reduce((acc, cur) => acc + cur.total, 0)
        };

        await orderService.create(payload);
        toast.success("Tạo đơn hàng thành công!");
        setOrderItems([]);
        setTranscript("");
        setSelectedCustomer(null);
        setCustomerSearchQuery("");
        setPaymentMethod("cash");
        if (onSuccess) onSuccess();
    } catch (error) {
        toast.error("Lỗi tạo đơn: " + (error.response?.data?.message || error.message));
    }
  };

  const totalAmount = orderItems.reduce((acc, cur) => acc + (cur.total || 0), 0);

  // Filter list cho Modal
  const filteredProducts = availableProducts.filter(p => 
    p.name.toLowerCase().includes(modalSearch.toLowerCase()) || 
    p.code?.toLowerCase().includes(modalSearch.toLowerCase())
  );

  const filteredCustomers = availableCustomers.filter(c => 
    c.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
    c.phone_number?.includes(modalSearch)
  );

  return (
    <div className="w-full space-y-4">
      {/* 1. INPUT GIỌNG NÓI */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
        <CardHeader className="pb-2">
           <CardTitle className="text-lg flex items-center gap-2 text-indigo-700">
              <Sparkles size={20} />
              Trợ lý AI Bán Hàng
           </CardTitle>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col gap-3">
              <div className="relative">
                 <textarea 
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Ví dụ: Lấy cho anh Nam 10 bao xi măng, chuyển khoản nhé..."
                    className="w-full min-h-[80px] p-3 pr-12 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-200 resize-none"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAnalyzeOrder();
                        }
                    }}
                 />
                 <div className="absolute bottom-3 right-3">
                    <Button
                       size="icon" variant={isRecording ? "destructive" : "secondary"}
                       className={`rounded-full h-10 w-10 shadow-md ${isRecording ? 'animate-pulse ring-4 ring-red-100' : ''}`}
                       onClick={isRecording ? stopRecording : startRecording}
                    >
                       {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                    </Button>
                 </div>
              </div>
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    {isLoading && <span className="text-sm text-indigo-600 flex items-center"><Loader2 className="w-4 h-4 mr-1 animate-spin"/> Đang phân tích...</span>}
                    <AudioVisualizer isRecording={isRecording} />
                 </div>
                 <Button onClick={handleAnalyzeOrder} disabled={isLoading || !transcript.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Send size={16} className="mr-2"/> Phân tích
                 </Button>
              </div>
           </div>
        </CardContent>
      </Card>

      {/* 2. CHI TIẾT ĐƠN HÀNG */}
      {(orderItems.length > 0 || selectedCustomer || customerSearchQuery) && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
           
           {/* INFO & THANH TOÁN */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CHỌN KHÁCH HÀNG */}
              <Card className="p-4 flex flex-col justify-center gap-2 border-l-4 border-l-blue-500">
                 <div className="flex justify-between items-center">
                     <div className="text-sm text-gray-500 flex items-center gap-2"><User size={14}/> Khách hàng</div>
                     {selectedCustomer && (
                         <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400" onClick={() => setSelectedCustomer(null)}><X size={14}/></Button>
                     )}
                 </div>
                 
                 {selectedCustomer ? (
                     <div 
                        className="font-bold text-lg cursor-pointer hover:text-blue-600 flex flex-col"
                        onClick={() => { setModalSearch(""); setIsCustomerModalOpen(true); }}
                     >
                         <span>{selectedCustomer.name}</span>
                         <span className="text-xs text-gray-500 font-normal">{selectedCustomer.phone_number} - {selectedCustomer.address}</span>
                     </div>
                 ) : (
                     <div className="flex gap-2">
                         <Input 
                            placeholder="Tên khách lẻ..." 
                            value={customerSearchQuery}
                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                            className="flex-1 font-bold"
                         />
                         <Button variant="outline" onClick={() => { setModalSearch(""); setIsCustomerModalOpen(true); }}>
                            <Search size={16} className="mr-2"/> Chọn
                         </Button>
                     </div>
                 )}
              </Card>

              {/* THANH TOÁN */}
              <Card className="p-4 flex flex-col justify-between border-l-4 border-l-green-500 gap-3">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-500">Tổng thanh toán</p>
                        <p className="font-bold text-2xl text-blue-600">{formatCurrency(totalAmount)}</p>
                    </div>
                    <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-[200px]">
                        <TabsList className="grid w-full grid-cols-3 h-8">
                            <TabsTrigger value="cash"><Banknote size={14}/></TabsTrigger>
                            <TabsTrigger value="transfer"><CreditCard size={14}/></TabsTrigger>
                            <TabsTrigger value="debt" className="data-[state=active]:text-red-600">Nợ</TabsTrigger>
                        </TabsList>
                    </Tabs>
                 </div>
                 <Button onClick={handleCreateOrder} className="w-full bg-green-600 hover:bg-green-700">Xác nhận tạo đơn</Button>
              </Card>
           </div>

           {/* BẢNG SẢN PHẨM */}
           <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                 <Table>
                    <TableHeader className="bg-gray-50">
                       <TableRow>
                          <TableHead className="w-10 text-center">#</TableHead>
                          <TableHead>Tên sản phẩm</TableHead>
                          <TableHead className="w-24 text-center">ĐVT</TableHead>
                          <TableHead className="w-28 text-center">SL</TableHead>
                          <TableHead className="w-32 text-right">Đơn giá</TableHead>
                          <TableHead className="w-32 text-right">Thành tiền</TableHead>
                          <TableHead className="w-10"></TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {orderItems.map((item, idx) => (
                          <TableRow key={idx} className={!item.found ? 'bg-red-50' : ''}>
                             <TableCell className="text-center text-gray-500">{idx + 1}</TableCell>
                             <TableCell>
                                {/* NÚT CHỌN SẢN PHẨM MỞ MODAL */}
                                <div 
                                    className="cursor-pointer hover:text-blue-600 font-medium flex items-center gap-2 select-none"
                                    onClick={() => {
                                        setEditingRowIndex(idx);
                                        setModalSearch("");
                                        setIsProductModalOpen(true);
                                    }}
                                >
                                    {item.product_name || <span className="text-gray-400 italic">Bấm để chọn sản phẩm...</span>}
                                    {!item.found && <AlertCircle size={14} className="text-red-500"/>}
                                </div>
                                {item.found && <div className="text-xs text-green-600">Kho: {item.stock_available}</div>}
                             </TableCell>
                             <TableCell className="text-center"><Badge variant="outline">{item.unit}</Badge></TableCell>
                             <TableCell>
                                <Input 
                                    type="number" 
                                    min="0"
                                    step={isDecimalUnit(item.unit) ? "0.1" : "1"} 
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                    className="h-8 text-center font-bold"
                                />
                             </TableCell>
                             <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                             <TableCell className="text-right font-bold text-blue-600">{formatCurrency(item.total)}</TableCell>
                             <TableCell>
                                <Button size="icon" variant="ghost" onClick={() => removeItem(idx)} className="h-8 w-8 hover:text-red-600"><Trash2 size={16}/></Button>
                             </TableCell>
                          </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </div>
              <div className="p-3 border-t bg-gray-50">
                 <Button variant="outline" onClick={addItem} className="w-full border-dashed"><Plus size={16} className="mr-2"/> Thêm dòng sản phẩm</Button>
              </div>
           </Card>
        </div>
      )}

      {/* --- MODAL CHỌN SẢN PHẨM --- */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Chọn sản phẩm từ kho</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 my-2">
                <Search className="text-gray-400"/>
                <Input placeholder="Tìm tên hoặc mã sản phẩm..." value={modalSearch} onChange={e => setModalSearch(e.target.value)} autoFocus />
            </div>
            <div className="overflow-y-auto flex-1 border rounded-md">
                <Table>
                    <TableHeader className="sticky top-0 bg-white">
                        <TableRow>
                            <TableHead>Tên sản phẩm</TableHead>
                            <TableHead>Đơn vị</TableHead>
                            <TableHead className="text-right">Giá bán</TableHead>
                            <TableHead className="text-center">Tồn kho</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map(p => (
                            <TableRow key={p.id} className="cursor-pointer hover:bg-gray-100" onClick={() => handleProductSelect(p)}>
                                <TableCell className="font-medium">{p.name}</TableCell>
                                <TableCell>{p.unit}</TableCell>
                                <TableCell className="text-right">{formatCurrency(Number(p.price))}</TableCell>
                                <TableCell className="text-center font-bold">{p.stock}</TableCell>
                                <TableCell><Button size="sm" variant="ghost">Chọn</Button></TableCell>
                            </TableRow>
                        ))}
                        {filteredProducts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8">Không tìm thấy sản phẩm</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL CHỌN KHÁCH HÀNG --- */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Danh sách khách hàng</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 my-2">
                <Search className="text-gray-400"/>
                <Input placeholder="Tìm tên hoặc số điện thoại..." value={modalSearch} onChange={e => setModalSearch(e.target.value)} autoFocus />
            </div>
            <div className="overflow-y-auto flex-1 border rounded-md">
                <Table>
                    <TableHeader className="sticky top-0 bg-white">
                        <TableRow>
                            <TableHead>Tên khách hàng</TableHead>
                            <TableHead>Số điện thoại</TableHead>
                            <TableHead>Địa chỉ</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.map(c => (
                            <TableRow key={c.id} className="cursor-pointer hover:bg-gray-100" onClick={() => { setSelectedCustomer(c); setIsCustomerModalOpen(false); }}>
                                <TableCell className="font-bold">{c.name}</TableCell>
                                <TableCell>{c.phone_number}</TableCell>
                                <TableCell>{c.address}</TableCell>
                                <TableCell><Button size="sm" variant="ghost">Chọn</Button></TableCell>
                            </TableRow>
                        ))}
                         {filteredCustomers.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8">Không tìm thấy khách hàng</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIOrderCreator;