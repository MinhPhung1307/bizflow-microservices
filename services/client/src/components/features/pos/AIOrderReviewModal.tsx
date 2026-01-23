import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle, CheckCircle, Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { productService } from '@/services/product.service'; // Service tìm SP
import { customerService } from '@/services/customer.service'; // Service tìm Khách

// Interface cho Item trong đơn nháp
interface DraftItem {
    product_id: string | null;
    product_name: string;      // Tên hiển thị
    ai_product_name: string;   // Tên gốc AI đoán
    quantity: number;
    price: number;
    unit: string;
    total: number;
    found: boolean;            // Tìm thấy trong DB hay không
    stock_available: number;
    image?: string;
    note?: string;
}

interface AIReviewProps {
    isOpen: boolean;
    onClose: () => void;
    aiResult: any; // Kết quả trả về từ API /api/orders/ai/create-draft
    onConfirmOrder: (finalOrder: any) => void; // Hàm gọi API tạo đơn thật
}

export default function AIOrderReviewModal({ isOpen, onClose, aiResult, onConfirmOrder }: AIReviewProps) {
    const [items, setItems] = useState<DraftItem[]>([]);
    const [customer, setCustomer] = useState<any>(null);
    const [isDebt, setIsDebt] = useState(false);
    const [originalMessage, setOriginalMessage] = useState("");

    // State tìm kiếm thay thế sản phẩm
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Load dữ liệu khi mở Modal
    useEffect(() => {
        if (aiResult && isOpen) {
            setItems(aiResult.items || []);
            setCustomer(aiResult.customer || null);
            setIsDebt(aiResult.is_debt || false);
            setOriginalMessage(aiResult.original_message || "");
        }
    }, [aiResult, isOpen]);

    // Tính tổng tiền động
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Xử lý thay đổi số lượng
    const handleQuantityChange = (index: number, newQty: number) => {
        const newItems = [...items];
        newItems[index].quantity = newQty;
        newItems[index].total = newItems[index].price * newQty;
        setItems(newItems);
    };

    // Xóa sản phẩm khỏi list
    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    // Tìm kiếm sản phẩm để thay thế (Map lại)
    const handleSearchProduct = async (query: string) => {
        setSearchQuery(query);
        if (query.length > 1) {
            try {
                // Gọi API search product của bạn
                const res = await productService.getAll({ search: query });
                setSearchResults(res);
            } catch (error) {
                console.error("Lỗi tìm sản phẩm:", error);
            }
        }
    };

    // Chọn sản phẩm thay thế cho dòng đang lỗi
    const handleSelectReplacement = (product: any) => {
        if (editingIndex !== null) {
            const newItems = [...items];
            newItems[editingIndex] = {
                ...newItems[editingIndex],
                found: true,
                product_id: product.id,
                product_name: product.name,
                price: Number(product.price),
                unit: product.unit || 'cái',
                stock_available: product.stock,
                total: Number(product.price) * newItems[editingIndex].quantity
            };
            setItems(newItems);
            setEditingIndex(null); // Đóng box tìm kiếm
            setSearchResults([]);
            setSearchQuery("");
        }
    };

    const handleConfirm = () => {
        // Validate: Không cho tạo đơn nếu còn sản phẩm chưa map (found = false)
        const invalidItems = items.filter(i => !i.found);
        if (invalidItems.length > 0) {
            toast.error(`Còn ${invalidItems.length} sản phẩm chưa xác định. Vui lòng chọn sản phẩm thay thế hoặc xóa bỏ.`);
            return;
        }

        const finalOrder = {
            customer_id: customer?.id || null,
            customer_name: customer?.name || "Khách lẻ",
            is_debt: isDebt,
            items: items.map(i => ({
                product_id: i.product_id,
                quantity: i.quantity,
                price: i.price,
                // Backend controller của bạn cần map đúng field này
            })),
            total_amount: totalAmount
        };

        onConfirmOrder(finalOrder);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Duyệt đơn hàng từ AI</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Phần 1: Tin nhắn gốc & Khách hàng */}
                    <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                        <div>
                            <Label className="text-muted-foreground">Yêu cầu gốc:</Label>
                            <p className="italic text-sm mt-1">"{originalMessage}"</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Khách hàng:</Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    value={customer?.name || ""} 
                                    placeholder="Khách lẻ"
                                    onChange={(e) => setCustomer({...customer, name: e.target.value})}
                                />
                                {/* Có thể thêm nút Search Customer ở đây nếu muốn */}
                            </div>
                            
                            <div className="flex items-center gap-2 mt-2">
                                <Switch 
                                    checked={isDebt} 
                                    onCheckedChange={setIsDebt}
                                    id="debt-mode"
                                />
                                <Label htmlFor="debt-mode" className={`font-bold ${isDebt ? 'text-red-600' : 'text-green-600'}`}>
                                    {isDebt ? 'Ghi nợ (Chưa thanh toán)' : 'Tiền mặt / Chuyển khoản'}
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Phần 2: Danh sách sản phẩm */}
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Tên sản phẩm</TableHead>
                                    <TableHead className="w-[100px]">Số lượng</TableHead>
                                    <TableHead>Đơn giá</TableHead>
                                    <TableHead>Thành tiền</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item, index) => (
                                    <TableRow key={index} className={!item.found ? "bg-red-50" : ""}>
                                        <TableCell>
                                            {item.found ? (
                                                <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1"/> OK</Badge>
                                            ) : (
                                                <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1"/> K.Thấy</Badge>
                                            )}
                                        </TableCell>
                                        
                                        <TableCell>
                                            {/* Nếu đang sửa dòng này thì hiện ô tìm kiếm */}
                                            {editingIndex === index ? (
                                                <div className="relative">
                                                    <Input 
                                                        autoFocus
                                                        placeholder="Tìm sản phẩm thay thế..."
                                                        value={searchQuery}
                                                        onChange={(e) => handleSearchProduct(e.target.value)}
                                                    />
                                                    {searchResults.length > 0 && (
                                                        <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                                                            {searchResults.map(prod => (
                                                                <div 
                                                                    key={prod.id} 
                                                                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                                    onClick={() => handleSelectReplacement(prod)}
                                                                >
                                                                    <div className="font-bold">{prod.name}</div>
                                                                    <div className="text-xs text-gray-500">Giá: {formatCurrency(Number(prod.price))} | Kho: {prod.stock}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.product_name}</span>
                                                    {!item.found && (
                                                        <span className="text-xs text-red-500">
                                                            AI đọc là: "{item.ai_product_name}" - Không có trong kho
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                min="0.1" 
                                                step="0.1"
                                                className="w-20 text-center"
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                                            />
                                        </TableCell>

                                        <TableCell>{formatCurrency(item.price)}</TableCell>
                                        <TableCell className="font-bold">{formatCurrency(item.price * item.quantity)}</TableCell>
                                        
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {!item.found && editingIndex !== index && (
                                                    <Button size="sm" variant="outline" onClick={() => {
                                                        setEditingIndex(index);
                                                        handleSearchProduct(item.ai_product_name); // Auto search theo tên AI
                                                    }}>
                                                        <Search className="w-4 h-4"/>
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleRemoveItem(index)}>
                                                    <Trash2 className="w-4 h-4"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end items-center gap-4 mt-2">
                         <div className="text-lg font-bold">
                             Tổng cộng: <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
                         </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Hủy bỏ</Button>
                    <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
                        Xác nhận tạo đơn
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}