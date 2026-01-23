// BizFlow/client/src/services/productService.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Định nghĩa lại kiểu dữ liệu cho chắc chắn
export interface Product {
  id?: number;
  owner_id?: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  images?: string;
  is_active?: boolean;
}

export const productService = {
  // 1. Lấy danh sách (GET)
  getAll: async () => {
    const res = await fetch(`${API_URL}/api/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // <--- QUAN TRỌNG: Gửi kèm Cookie
    });

    if (!res.ok) {
        if (res.status === 401) throw new Error('Phiên đăng nhập hết hạn');
        throw new Error('Không thể tải danh sách sản phẩm');
    }
    
    const data = await res.json();
    return data.data;
  },

  // 2. Tạo mới (POST)
  create: async (product: Product) => {
    const res = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // <--- QUAN TRỌNG: Gửi kèm Cookie
      body: JSON.stringify(product),
    });
    
    if (!res.ok) throw new Error('Lỗi khi tạo sản phẩm');
    return res.json();
  },

  // 3. Cập nhật (PUT)
  update: async (id: number, product: Product) => {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // <--- QUAN TRỌNG: Gửi kèm Cookie
      body: JSON.stringify(product),
    });

    if (!res.ok) throw new Error('Lỗi khi cập nhật sản phẩm');
    return res.json();
  },

  // 4. Xóa (DELETE)
  delete: async (id: number) => {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // <--- QUAN TRỌNG: Gửi kèm Cookie
    });

    if (!res.ok) throw new Error('Lỗi khi xóa sản phẩm');
    return res.json();
  }
};