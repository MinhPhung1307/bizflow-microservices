'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Printer, Plus, Edit, Trash2, X, RefreshCw, Barcode as BarcodeIcon, Check, PackagePlus, Filter, Scale, CheckCircle2, Database, Edit3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { productService } from '../../services/product.service';
import { ownerService } from '../../services/owner.service';
import { Product } from '../../types';
import { toast } from 'sonner';

const COMMON_CATEGORIES = [
  "Vật liệu xây dựng",
  "Thiết bị điện",
  "Thiết bị nước",
  "Ngũ kim & Dụng cụ",
  "Sơn & Hóa chất",
  "Gạch ốp lát",
  "Thiết bị vệ sinh",
  "Đồ gia dụng",
  "Khác (Nhập tay...)"
];

// Bộ từ khóa để AI gợi ý danh mục
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Vật liệu xây dựng": ["xi măng", "gạch", "cát", "đá", "sắt", "thép", "bê tông", "lưới", "kẽm"],
  "Thiết bị điện": ["điện", "bóng đèn", "ổ cắm", "công tắc", "led", "dây điện", "aptomat", "phích"],
  "Thiết bị nước": ["vòi", "ống", "nhựa", "van", "nước", "co", "tê", "măng sông", "phi"],
  "Sơn & Hóa chất": ["sơn", "chống thấm", "keo", "bột trét", "dung môi", "xăng thơm"],
  "Gạch ốp lát": ["men", "ốp", "lát", "viền", "ceramic", "granite", "gỗ sàn"],
  "Thiết bị vệ sinh": ["bồn cầu", "chậu rửa", "vệ sinh", "lavabo", "sen tắm", "gương"],
  "Ngũ kim & Dụng cụ": ["búa", "kìm", "vít", "khóa", "ốc", "tán", "bản lề", "máy khoan", "máy cắt"],
  "Đồ gia dụng": ["xô", "chậu", "thang", "nhựa", "quạt", "chổi"]
};

// Bộ từ điển gợi ý đơn vị cơ sở và hệ số quy đổi
const UOM_GROUP_MAPPING : Record<string, { base: string; factor: number }> = {
    // Nhóm Trọng lượng
    'Tấn': { base: 'Kg', factor: 1000 },
    'Tạ': { base: 'Kg', factor: 100 },
    'Yến': { base: 'Kg', factor: 10 },
    'Kg': { base: 'Kg', factor: 1 },
    
    // Nhóm Kích thước (Số liệu phổ biến trong ngành VLXD/Cơ khí)
    'Cuộn': { base: 'Mét', factor: 100 }, // VD: Cuộn dây điện, lưới B40
    'Cây': { base: 'Mét', factor: 6 },    // VD: Cây sắt, cây ống nhựa chuẩn 6m
    'Thanh': { base: 'Mét', factor: 4 },  // VD: Thanh nhôm, thanh gỗ 3-4m
    'Mét': { base: 'Mét', factor: 1 },
    
    // Nhóm Đặc thù VLXD
    'Thiên': { base: 'Viên', factor: 1000 },
    'Xe': { base: 'Khối (m3)', factor: 4 },     // Trung bình 1 xe tải nhỏ
    'Chuyến': { base: 'Khối (m3)', factor: 1 },
    
    // Nhóm Đóng gói (Số liệu mặc định gợi ý)
    'Bao': { base: 'Kg', factor: 50 },    // Chuẩn xi măng/bột trét
    'Thùng': { base: 'Cái', factor: 24 }, // Phổ biến nhất
    'Hộp': { base: 'Cái', factor: 10 },
    'Lốc': { base: 'Cái', factor: 6 },
    'Kiện': { base: 'Cái', factor: 100 },
    'Túi': { base: 'Cái', factor: 10 },
    'Vỉ': { base: 'Cái', factor: 10 },
    
    // Nhóm Chất lỏng
    'Can': { base: 'Lít', factor: 5 },
    'Phuy': { base: 'Lít', factor: 200 },
    'Lít': { base: 'Lít', factor: 1 }
};

const EMPTY_ARRAY: any[] = [];

// SỬ DỤNG NAMED EXPORT ĐỂ KHỚP VỚI page.tsx
export const InventoryManager = () => {
    const queryClient = useQueryClient();
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const [isNewProduct, setIsNewProduct] = useState(true);
    const [isAddingNewUom, setIsAddingNewUom] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>({
        id: undefined,
        name: '', 
        category: '', 
        selling_price: 0,
        price: 0, 
        stock: 0, 
        code: '', 
        unit: '', 
        quantity: 1, 
        importPrice: 0, 
        supplier: '', 
        uomId: undefined,
        conversionFactor: 1, // Hệ số quy đổi cho đơn vị mới
        newUomName: '' // Tên đơn vị mới nếu muốn thêm
    });

    const [isManualCategory, setIsManualCategory] = useState(false);

    // Tự động quản lý trạng thái loading với useQuery
    const { data: productsData, isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: productService.getAll,
    });

    const products = useMemo(() => productsData || EMPTY_ARRAY, [productsData]);

    const { data: globalUomsData = [] } = useQuery({
        queryKey: ['all-uoms'],
        queryFn: ownerService.getAllUoms,
    });
    const globalUoms = Array.isArray(globalUomsData) ? globalUomsData : EMPTY_ARRAY;

    // Lấy toàn bộ đơn vị của cửa hàng ngay từ đầu
    const { data: storeUomsData = [] } = useQuery({
        queryKey: ['store-uoms'],
        queryFn: async () => {
            const response = await ownerService.getStoreUoms();
            return response.data || response;
        },
    });
    const storeUoms = storeUomsData || EMPTY_ARRAY;

    // Lấy đơn vị tính của sản phẩm khi formData.id thay đổi
    const { data: productUoms = [], isLoading: isLoadingUoms } = useQuery({
        queryKey: ['product-uoms', formData.id],
        queryFn: async () => {
            return ownerService.getProductUoms(formData.id!);
        },
        enabled: !!formData.id && formData.id !== undefined,
    });

    const activeUomMapping = useMemo(() => {
        const newMapping = { ...UOM_GROUP_MAPPING };

        // FIX: Đảm bảo biến là Array trước khi loop
        const safeGlobalUoms = Array.isArray(globalUoms) ? globalUoms : [];
        const safeStoreUoms = Array.isArray(storeUoms) ? storeUoms : [];

        safeGlobalUoms.forEach((uom: any) => {
            if (uom?.uom_name && uom?.base_unit) {
                newMapping[uom.uom_name] = {
                    base: uom.base_unit,
                    factor: Number(uom.conversion_factor) || 1
                };
            }
        });

        safeStoreUoms.forEach((uom: any) => {
            if (uom?.uom_name) {
                newMapping[uom.uom_name] = {
                    base: uom.base_unit,
                    factor: Number(uom.conversion_factor) || 1
                };
            }
        });

        return newMapping;
    }, [globalUoms, storeUoms]);

    // Mutation để Thêm/Sửa
    const mutation = useMutation({
        mutationFn: (payload: any) => 
            editingProduct?.id 
                ? productService.update(editingProduct.id, payload) 
                : productService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success(editingProduct ? 'Cập nhật thành công!' : 'Thêm sản phẩm thành công!');
            closeModal();
        },
        onError: () => toast.error('Có lỗi xảy ra, vui lòng thử lại.')
    });

    // Mutation xử lý nhập hàng (Gửi về Backend xử lý Transaction)
    const importMutation = useMutation({
        mutationFn: (payload: any) => ownerService.importStock(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Nhập kho thành công!');
            closeModal();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Lỗi khi gửi dữ liệu');
        }
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('user'); // Hoặc key bạn dùng để lưu user
            if (userStr) {
                setCurrentUser(JSON.parse(userStr));
            }
        }
    }, []);

    // Tìm kiếm sản phẩm khi người dùng nhập/quét mã vạch
    useEffect(() => {
        // 1. Lấy mã và xóa bỏ khoảng trắng/ký tự xuống dòng từ máy quét
        const searchCode = formData.code?.trim();

        // 2. Nếu ô nhập trống, reset về trạng thái sản phẩm mới
        if (!searchCode) {
            setIsNewProduct(true);
            setFormData(prev => ({
                ...prev,
                id: undefined,
                name: '',
                category: '',
                price: 0,
                stock: 0,
            }));
            return;
        }

        const foundProduct = products.find(
            (p: any) => p.code === searchCode
        );

        // 3. Chỉ tìm kiếm khi danh sách sản phẩm đã tải xong
        if (foundProduct) {
            if (formData.id !== foundProduct.id) {
                setIsNewProduct(false);
                setFormData(prev => ({
                    ...prev,
                    id: foundProduct.id,
                    name: foundProduct.name,
                    category: foundProduct.category,
                    unit: foundProduct.unit || 'Cái',
                    price: Number(foundProduct.price || 0),
                    stock: Number(foundProduct.stock || 0),
                }));
            }
        } else {
            if (!isNewProduct || formData.id) {
                setIsNewProduct(true);
                setFormData(prev => ({
                    ...prev,
                    id: undefined,
                    name: '',
                    category: '',
                    stock: 0,
                }));
            }
        }
    }, [formData.code, products]);


    useEffect(() => {
        // 1. Kiểm tra nếu chưa có dữ liệu thì không làm gì cả
        if (!globalUoms && !storeUoms) return;

        const newMapping = { ...UOM_GROUP_MAPPING };

        // 2. Sử dụng Optional Chaining và đảm bảo luôn là Array
        const safeGlobalUoms = Array.isArray(globalUoms) ? globalUoms : [];
        const safeStoreUoms = Array.isArray(storeUoms) ? storeUoms : [];

        safeGlobalUoms.forEach((uom: any) => {
            if (uom?.uom_name && uom?.base_unit) {
                newMapping[uom.uom_name] = {
                    base: uom.base_unit,
                    factor: Number(uom.conversion_factor) || 1
                };
            }
        });

        safeStoreUoms.forEach((uom: any) => {
            if (uom?.uom_name) {
                newMapping[uom.uom_name] = {
                    base: uom.base_unit,
                    factor: Number(uom.conversion_factor) || 1
                };
            }
        });
    }, [globalUoms, storeUoms]);

    const deleteMutation = useMutation({
        mutationFn: productService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Đã xóa sản phẩm');
        }
    });

    const closeModal = () => {
        setIsImportModalOpen(false);
        setIsNewProduct(true);
        setIsAddingNewUom(false);
        setFormData({
            id: undefined, name: '', category: '', price: 0, 
            importPrice: 0, quantity: 1, code: '', unit: '', supplier: '', 
            uomId: undefined, newUomName: '', conversionFactor: 1
        });
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData(product);
        setIsNewProduct(false);
        setIsImportModalOpen(true);
    };

    // Hàm helper hiển thị màu trạng thái
    const getStatusColor = (stock: number) => {
        if (stock === 0) return 'bg-red-100 text-red-700 border-red-200';
        if (stock < 10) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-green-100 text-green-700 border-green-200';
    };

    // Hàm xử lý thay đổi tên sản phẩm
    const handleNameChange = (name: string) => {
        let suggestedCategory = formData.category || "";

        // Chỉ gợi ý nếu người dùng chưa chọn danh mục hoặc danh mục đang trống
        if (!formData.category || formData.category === "") {
            const lowerName = name.toLowerCase();
            
            // Duyệt qua bộ từ khóa để tìm danh mục khớp nhất
            for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
                if (keywords.some(keyword => lowerName.includes(keyword))) {
                    suggestedCategory = category;
                    break; // Tìm thấy rồi thì dừng lại
                }
            }
        }

        setFormData({
            ...formData,
            name: name,
            category: suggestedCategory
        });
    };

    // Hàm xử lý thay đổi danh mục (Chọn từ dropdown hoặc nhập tay)
    const handleCategoryChange = (val: string) => {
        if (val === "Khác (Nhập tay...)") {
            setIsManualCategory(true);
            setFormData({ ...formData, category: '' }); // Xóa trắng để người dùng nhập mới
        } else {
            setIsManualCategory(false);
            setFormData({ ...formData, category: val });
        }
    };

    // Lấy thông tin sản phẩm hiện tại từ danh sách products
    const currentProductInfo = products.find((p: any) => p.id === formData.id);
    const currentSellingPrice = currentProductInfo?.price || 0;

    // 1. Tính tổng tiền phiếu nhập (Sỉ)
    const totalImportBill = (Number(formData.importPrice) || 0) * (Number(formData.quantity) || 0);

    // 2. Tính giá vốn lẻ thực tế (1 đơn vị lẻ)
    const unitCost = (Number(formData.importPrice) || 0) / (Number(formData.conversionFactor) || 1);

    // 3. Tính tỉ lệ lợi nhuận (%)
    // Công thức: ((Giá bán - Giá vốn) / Giá vốn) * 100
    const profitMargin = unitCost > 0 
        ? ((Number(formData.price) - unitCost) / unitCost) * 100 
        : 0;


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.unit) {
            toast.error("Đơn vị tính không được để trống");
            return;
        }
        
        // Kiểm tra các trường bắt buộc
        if (!formData.code || !formData.name || !formData.price) {
            toast.error("Vui lòng điền đầy đủ Mã, Tên và Giá bán lẻ");
            return;
        }

        // Gửi flag isNewProduct để Backend biết đường xử lý
        const respose = await ownerService.importStock(formData)
    };

    // --- PHẦN GIAO DIỆN (UI) ---
    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Quản lý kho hàng</h2>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
                        <Printer size={18} /> Xuất kho
                    </button>
                    <button 
                        onClick={() => {
                            setIsImportModalOpen(true);
                            setIsNewProduct(true);
                        }}
                        className="flex-1 md:flex-none flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition-all"
                    >
                        <Plus size={18} /> Nhập hàng
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Tìm sản phẩm..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"><Filter size={18} className="text-slate-600" /></button>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Mã SP</th>
                                <th className="p-4">Tên sản phẩm</th>
                                <th className="p-4">Danh mục</th>
                                <th className="p-4 text-right">Giá bán</th>
                                <th className="p-4 text-center">Tồn kho</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Đang tải dữ liệu kho...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : products.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Chưa có sản phẩm nào.</td></tr>
                            ) : (
                                products.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-slate-500 font-mono">{p.code}</td>
                                        <td className="p-4 font-medium text-slate-800">{p.name}</td>
                                        <td className="p-4 text-slate-600">{p.category}</td>
                                        <td className="p-4 text-right font-medium text-slate-700">
                                            {formatCurrency(p.price)} / {p.unit}
                                        </td>
                                        <td className="p-4 text-center font-bold">{p.stock}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(p.stock)}`}>
                                                {p.stock === 0 ? 'Hết hàng' : p.stock < 10 ? 'Sắp hết' : 'Còn hàng'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => openEditModal(p)}
                                                    className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition" 
                                                    title="Sửa"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => p.id && deleteMutation.mutate(p.id)}
                                                    className="p-1.5 hover:bg-red-50 text-red-600 rounded transition"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={16} />
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

            {/* --- MODAL NHẬP HÀNG TỔNG HỢP --- */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200">
                        <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <BarcodeIcon size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Phiếu nhập kho</h3>
                                    <p className="text-xs text-slate-500">Quét mã vạch SP cũ hoặc tạo SP mới</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        
                        <form onSubmit={(e) => { e.preventDefault(); importMutation.mutate(formData); }} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* CỘT TRÁI: THÔNG TIN MÃ VÀ ĐỊNH DANH */}
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-bold text-slate-700">
                                            Mã sản phẩm <span className="text-blue-500">(Quét để nhận diện)</span>
                                        </label>
                                        <div className="relative">
                                            <input 
                                                ref={barcodeInputRef}
                                                className={`w-full px-4 py-3 bg-slate-100 border-2 rounded-xl outline-none font-mono text-lg transition-all ${
                                                    !isNewProduct && formData.id ? 'border-green-500 bg-green-50/30' : 'focus:border-blue-500'
                                                }`}
                                                placeholder="Quét mã tại đây..."
                                                value={formData.code}
                                                onChange={e => setFormData({...formData, code: e.target.value})}
                                            />
                                            {!isNewProduct && formData.id && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                                                    <CheckCircle2 size={24} />
                                                </div>
                                            )}
                                        </div>
                                    </div>


                                    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                                        isNewProduct 
                                        ? 'bg-orange-50 border-orange-100 text-orange-600' 
                                        : 'bg-green-50 border-green-100 text-green-600'
                                    }`}>
                                        {isNewProduct ? (
                                            <>
                                                <PackagePlus size={14} className="shrink-0" />
                                                <span className="text-[10px] font-bold uppercase tracking-tight">Sản phẩm mới - Thiết lập thông tin</span>
                                            </>
                                        ) : (
                                            <>
                                                <Database size={14} className="shrink-0" />
                                                <span className="text-[10px] font-bold uppercase tracking-tight">Sản phẩm có sẵn</span>
                                            </>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Tên sản phẩm</label>
                                        <input 
                                            disabled={!isNewProduct && formData.id !== undefined}
                                            type="text" 
                                            className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                            value={formData.name}
                                            onChange={e => handleNameChange(e.target.value)}
                                            required
                                        />
                                        {!isNewProduct && formData.id && (
                                            <div className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                                                <Check size={12}/> Đã khớp với sản phẩm trong kho
                                            </div>
                                        )}
                                    </div>

                                    {/* HIỂN THỊ TỒN KHO HIỆN TẠI */}
                                    {!isNewProduct && (
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Tồn kho hiện tại:</span>
                                            <div className="text-sm font-black text-slate-700">
                                                {products.find(p => p.id === formData.id)?.stock || 0} {formData.unit}
                                            </div>
                                        </div>
                                    )}

                                    {/* Vùng chọn/nhập danh mục */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-slate-700">Danh mục</label>

                                        {!isNewProduct && formData.id ? (  
                                            /* CHẾ ĐỘ 1: CHỌN TỪ DANH SÁCH */
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <input
                                                        disabled
                                                        className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                                                        value={formData.category}
                                                    />
                                                    <div className="absolute right-3 top-1/3 -translate-y-1/2 text-green-600">
                                                        <CheckCircle2 size={18} />
                                                    </div>
                                                    <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                                                        ✓ Danh mục đã được thiết lập từ trước
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            /* TRƯỜNG HỢP 2: SẢN PHẨM MỚI (CHỌN HOẶC NHẬP TAY) */
                                            !isManualCategory ? (
                                                /* CHẾ ĐỘ CHỌN TỪ DANH SÁCH */
                                                <div className="space-y-2">
                                                    <select
                                                        className={`w-full px-4 py-2.5 border-2 rounded-xl focus:border-blue-500 outline-none bg-white font-medium transition-all ${
                                                            formData.category ? 'border-green-200 bg-green-50/30' : 'border-slate-200'
                                                        }`}
                                                        value={formData.category}
                                                        onChange={(e) => {
                                                            if (e.target.value === "Khác (Nhập tay...)") {
                                                                setIsManualCategory(true);
                                                                setFormData({ ...formData, category: "" });
                                                            } else {
                                                                setFormData({ ...formData, category: e.target.value });
                                                            }
                                                        }}
                                                        required
                                                    >
                                                        <option value="">-- Chọn danh mục --</option>
                                                        {COMMON_CATEGORIES.map((cat) => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                    {formData.category && (
                                                        <p className="text-[10px] text-green-600 font-medium ml-1 animate-in fade-in">
                                                            ✓ Đã phân loại: {formData.category}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                /* CHẾ ĐỘ NHẬP TAY DANH MỤC MỚI */
                                                <div className="relative animate-in slide-in-from-top-1 duration-200">
                                                    <input
                                                        autoFocus
                                                        placeholder="Nhập tên danh mục mới..."
                                                        className="w-full px-4 py-2.5 border-2 border-blue-400 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 bg-white font-medium"
                                                        value={formData.category}
                                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsManualCategory(false);
                                                            setFormData({ ...formData, category: "" });
                                                        }}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 bg-white shadow-sm"
                                                    >
                                                        QUAY LẠI
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {/* Vùng nhập Đơn vị & Quy đổi */}
                                    <div className="p-5 bg-blue-50/50 border-2 border-blue-100 rounded-2xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                                <Scale size={18} className="text-blue-600"/> 
                                                {!isAddingNewUom ? ' Đơn vị tính & Quy đổi' : ' Thiết lập quy đổi mới'}
                                            </label>
                                            {!isAddingNewUom ? (
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAddingNewUom(true);
                                                        setFormData(prev => ({ ...prev, uomId: undefined, newUomName: '', conversionFactor: 1 }));
                                                    }}
                                                    className="text-xs font-bold text-blue-600 hover:bg-blue-100 px-2 py-1 rounded-md transition-all flex items-center gap-1"
                                                >
                                                    <Plus size={14} /> Thêm quy đổi mới
                                                </button>
                                            ) : (
                                                <button 
                                                type="button"
                                                onClick={() => setIsAddingNewUom(false)}
                                                className="text-xs font-bold text-red-500 hover:bg-blue-100 px-2 py-1 rounded-md transition-all flex items-center gap-1"
                                            >
                                                ✕ Hủy thêm mới
                                            </button>
                                            )}
                                        
                                        </div>
                                        
                                        {/* Vùng chọn đơn vị */}
                                        {!isAddingNewUom && (
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* --- CỘT 1: CHỌN ĐƠN VỊ NHẬP HÀNG --- */}
                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">
                                                        Đơn vị nhập hàng
                                                    </label>
                                                    <select 
                                                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 shadow-sm transition-all"
                                                        value={formData.uomId || ""}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (!val) return;

                                                            // Tìm tên đơn vị dựa trên ID đã chọn (từ globalUoms hoặc productUoms)
                                                            const selectedUom = globalUoms?.find((u: any) => u.id === val) || 
                                                                                productUoms?.find((u: any) => u.uom_id === val);
                                                            
                                                            const uomName = selectedUom?.uom_name || "";
                                                            
                                                            const mapping = UOM_GROUP_MAPPING[uomName as keyof typeof UOM_GROUP_MAPPING];

                                                            setFormData({
                                                                ...formData,
                                                                uomId: val,
                                                                newUomName: uomName,
                                                                // Nếu tìm thấy mapping, tự điền base và factor. Nếu không, giữ giá trị cũ.
                                                                unit: mapping ? mapping.base : formData.unit,
                                                                conversionFactor: mapping ? mapping.factor : 1
                                                            });
                                                        }}
                                                    >
                                                        <option value="">Chọn đơn vị</option>
                                                        {/* Nhóm 1: Đơn vị do chủ cửa hàng tự định nghĩa */}
                                                        <optgroup label="👤 Đơn vị của tôi">
                                                            {globalUoms
                                                                .filter((u: any) => u.owner_id === currentUser.id)
                                                                .map((u: any) => (
                                                                    <option key={u.id} value={u.id}>{u.uom_name}</option>
                                                                ))
                                                            }
                                                        </optgroup>
                                                        <optgroup label="📦 Đơn vị hệ thống">
                                                            {globalUoms
                                                                .filter((u: any) => u.owner_id !== currentUser.id)
                                                                .map((u: any) => (
                                                                <option key={u.id} value={u.id}>{u.uom_name}</option>
                                                            ))}
                                                        </optgroup>
                                                    </select>
                                                </div>

                                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="space-y-1">
                                                            <label className="text-[11px] font-bold text-slate-500 uppercase">Đơn vị bán lẻ</label>
                                                            <select 
                                                                className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500"
                                                                value={formData.unit}
                                                                onChange={e => setFormData({...formData, unit: e.target.value})}
                                                            >
                                                                <option value={formData.unit}>{formData.unit}</option>
                                                            </select>
                                                        </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Form thiết lập quy đổi từ danh sách đơn vị chung */}
                                        {isAddingNewUom && (
                                            <>
                                                <div className="grid grid-cols-12 gap-3 items-end bg-white p-5 rounded-2xl border border-blue-100 shadow-sm animate-in slide-in-from-top-2">

                                                    {/* VẾ TRÁI: ĐƠN VỊ NHẬP HÀNG (DẠNG NHẬP TAY) */}
                                                    <div className="col-span-5 space-y-1.5">
                                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                                                            Đơn vị nhập hàng
                                                        </label>
                                                        <div className="relative">
                                                            <input 
                                                                type="text"
                                                                placeholder="VD: Thùng, Bao, Cuộn..."
                                                                className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl font-bold text-orange-700 outline-none focus:border-orange-500 focus:bg-white transition-all shadow-inner"
                                                                value={formData.newUomName || ""}
                                                                onChange={e => setFormData({...formData, newUomName: e.target.value})}
                                                            />
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-orange-300">
                                                                <Edit3 size={14} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* DẤU BẰNG (=) */}
                                                    <div className="col-span-1 text-center font-black text-slate-300 text-2xl pb-3">
                                                        =
                                                    </div>

                                                    {/* VẾ PHẢI: QUY ĐỔI RA ĐƠN VỊ BÁN LẺ */}
                                                    <div className="col-span-6 space-y-1.5">
                                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1 flex justify-between">
                                                            <span>Đơn vị bán lẻ</span>
                                                        </label>
                                                        
                                                        <div className="flex items-center gap-2 bg-blue-50 border-2 border-blue-200 rounded-xl px-2 py-1 focus-within:border-blue-500 focus-within:bg-white transition-all shadow-sm">
                                                            {/* Ô NHẬP SỐ LƯỢNG */}
                                                            <input 
                                                                type="number"
                                                                placeholder="Số"
                                                                className="w-16 py-2 bg-transparent font-black text-blue-700 outline-none text-center text-lg"
                                                                value={formData.conversionFactor || ""}
                                                                onChange={e => setFormData({...formData, conversionFactor: Number(e.target.value)})}
                                                                min="1"
                                                            />
                                                            
                                                            <div className="h-8 w-[2px] bg-blue-100 mx-1"></div>
                                                            
                                                            {/* Ô NHẬP TÊN ĐƠN VỊ LẺ (VD: Kg, Cái) */}
                                                            <input 
                                                                type="text"
                                                                placeholder="Kg, Cái..."
                                                                className="flex-1 py-2 bg-transparent font-bold text-blue-600 outline-none text-sm italic"
                                                                value={formData.unit || ""}
                                                                onChange={e => setFormData({...formData, unit: e.target.value})}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <p className="text-[12px] text-blue-500 italic mt-2 ml-1">
                                            💡 Quy đổi: 1 {formData.newUomName} = {formData.conversionFactor} {formData.unit}
                                        </p>
                                    </div>
                                </div>
                                

                                {/* CỘT PHẢI: GIÁ VÀ SỐ LƯỢNG */}
                                <div className="space-y-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-blue-800 mb-1">Số lượng nhập</label>
                                            <input 
                                                type="number" 
                                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 outline-none text-lg font-bold"
                                                value={formData.quantity}
                                                onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                                                min="1" required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-blue-800 mb-1">Giá nhập/Đơn vị</label>
                                            <input 
                                                type="number" 
                                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 outline-none font-bold"
                                                value={formData.importPrice}
                                                onChange={e => setFormData({...formData, importPrice: Number(e.target.value)})}
                                                min="0" required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-1">
                                        <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="text-slate-400"><RefreshCw size={14} /></div>
                                            <div>
                                                <div className="text-[12px] font-bold text-slate-400 uppercase leading-none mb-0.5">Giá hiện tại</div>
                                                <div className="text-xm font-black text-slate-600 suppressHydrationWarning">
                                                    {currentSellingPrice.toLocaleString('vi-VN')} VNĐ
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                                            <div className="text-blue-500"><Scale size={14} /></div>
                                            <div>
                                                <div className="text-[12px] font-bold text-blue-400 uppercase leading-none mb-0.5">Vốn 1 {formData.unit}</div>
                                                <div className="text-xm font-black text-blue-700">
                                                    {unitCost.toLocaleString('vi-VN')} VNĐ
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Giá bán lẻ / {formData.unit}</label>
                                        <input 
                                            type="number" 
                                            className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 outline-none text-green-600 font-bold"
                                            value={formData.price}
                                            onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Nhà cung cấp / Ghi chú</label>
                                        <textarea 
                                            rows={2}
                                            className="w-full px-4 py-3 border-2 rounded-xl outline-none"
                                            placeholder="Ghi chú nguồn hàng..."
                                            value={formData.supplier}
                                            onChange={e => setFormData({...formData, supplier: e.target.value})}
                                        />
                                    </div>
                                    
                                    {/* // TÍNH TOÁN TỔNG TIỀN & LỢI NHUẬN */}
                                    <div className="pt-3 border-t border-dashed border-slate-200 space-y-3">
                                        {/* TỔNG TIỀN PHIẾU NHẬP */}
                                        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl shadow-lg animate-in fade-in zoom-in duration-300">
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng tiền cần trả</div>
                                                <div className="text-xs text-slate-500 italic">({formData.quantity} x {formatCurrency(formData.importPrice || 0)})</div>
                                            </div>
                                            <div className="text-xl font-black text-orange-400">
                                                {formatCurrency(totalImportBill)}
                                            </div>
                                        </div>

                                        {/* GIÁ TRỊ NHẬP LẺ & LỢI NHUẬN */}
                                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-2">
                                            {/* TỈ LỆ LỢI NHUẬN */}
                                            <div className="flex justify-between items-center pt-2 border-t border-indigo-200/50">
                                                <span className="text-xs font-bold text-indigo-800">Tỉ lệ lợi nhuận:</span>
                                                <div className={`flex items-center gap-1 text-sm font-black ${profitMargin >= 20 ? 'text-green-600' : 'text-amber-600'}`}>
                                                    {profitMargin.toFixed(1)}%
                                                    {profitMargin >= 20 ? <Check size={14}/> : <Scale size={14}/>}
                                                </div>
                                            </div>
                                            
                                            {/* Thanh progress bar hiển thị trực quan mức lãi */}
                                            <div className="w-full bg-indigo-200 rounded-full h-1.5 mt-1">
                                                <div 
                                                    className={`h-1.5 rounded-full transition-all duration-500 ${profitMargin >= 20 ? 'bg-green-500' : 'bg-amber-500'}`}
                                                    style={{ width: `${Math.min(Math.max(profitMargin, 0), 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={importMutation.isPending}
                                className="w-full mt-6 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200 disabled:bg-slate-400"
                            >
                                {importMutation.isPending ? 'Đang xử lý...' : isNewProduct ? 'TẠO MỚI & NHẬP KHO' : 'XÁC NHẬN NHẬP KHO'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};