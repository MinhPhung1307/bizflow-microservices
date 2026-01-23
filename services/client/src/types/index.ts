// src/types/index.ts

export type Role = 'ADMIN' | 'OWNER' | 'EMPLOYEE';

export interface User {
  readonly id: string;
  name: string;
  phone: string;
  role: Role;
  owner_id?: string; // Nếu là employee thì cần biết thuộc owner nào
}

export interface Owner {
  id: string;
  full_name: string;
  shop_name: string;
  phone_number: string;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  created_at?: string;
}

export interface Product {
  readonly id: string;
  owner_id: string;
  code?: string;      // Mã sản phẩm hoặc Barcode
  name: string;
  category?: string;
  quantity: number; // Số lượng dùng khi nhập kho
  importPrice: number; // Giá nhập dùng khi nhập kho
  uomId?: number;     // Đơn vị tính
  supplier?: string; // Nhà cung cấp dùng khi nhập kho
  price: number;       // DECIMAL(19,2)
  selling_price?: number; // Giá bán lẻ
  stock: number;       // stock trong DB
  unit?: string;       // Lưu ý: Trong file Product.js bạn gửi KHÔNG CÓ cột 'unit'. Bạn nên thêm cột này vào DB nếu cần, hoặc tạm dùng 'Cái'.
  images?: string[];    // JSONB trong DB -> Mảng string ở Frontend
  conversionFactor?: number; // Hệ số quy đổi
  newUomName?: string; // Tên đơn vị tính mới khi tạo
  is_active: boolean;
  created_at: string;

}

// Interface cho payload tạo đơn hàng
export interface CreateOrderPayload {
  customer_id?: string | null;  // Có thể null
  customer_name?: string;       // Lưu tên khách vãng lai
  order_type: 'AT_COUNTER' | 'PHONE_ZALO';
  payment_method: 'CASH' | 'TRANSFER' | 'DEBT';
  status: 'PENDING' | 'COMPLETED' | 'CANCELED';
  is_debt: boolean;
  total_price: number;
  tax_price: number;            // Có thể = 0
  items: {
    product_id: string;
    quantity: number;
    price: number;
  }[];
}

export interface ApiResponse<T> {
  success?: boolean; // Có thể có hoặc không
  message?: string;
  data: T;
}

export interface Order {
  id: string;
  customer_name: string;
  total_price: number; // Lưu ý: Database trả về string cho kiểu DECIMAL, cần ép kiểu hoặc xử lý
  payment_method: 'CASH' | 'TRANSFER' | 'DEBT';
  order_type: 'AT_COUNTER' | 'PHONE_ZALO';
  status: 'PENDING' | 'COMPLETED' | 'CANCELED';
  created_at: string;
  created_by_name?: string;
}