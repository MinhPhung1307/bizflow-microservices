// client/src/services/product.service.ts
import api from '@/lib/axios';
import { Product } from '@/types';

export const productService = {
  getAll: async (params?: any): Promise<Product[]> => {
    const response = await api.get('/products', { params }); 
    
    // 1. Lấy mảng data từ cấu trúc { success: true, count: 5, data: [...] }
    const rawData = response.data?.data || [];

    if (!Array.isArray(rawData)) return [];

    // 2. Map dữ liệu để khớp với Frontend
    return rawData.map((item: any) => {
      // Xử lý ảnh: item.images là ["url"] -> lấy phần tử đầu tiên
      let imageUrl = '/placeholder.png';
      if (Array.isArray(item.images) && item.images.length > 0) {
        imageUrl = item.images[0];
      } else if (typeof item.images === 'string' && item.images.startsWith('http')) {
        imageUrl = item.images;
      }

      return {
        id: item.id || '',
        owner_id: item.owner_id || '',
        name: item.name || '',
        code: item.code || '---', // JSON của bạn chưa có field 'code', tạm để '---'
        
        // Convert giá từ String "45000.00" -> Number 45000
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 0), 
        importPrice: Number(item.import_price || item.importPrice || 0),
        
        // Convert stock
        stock: Number(item.stock || 0),
        
        unit: item.unit || 'Cái',
        category: item.category || '',
        image: imageUrl, // Gán ảnh đã xử lý vào đây

        is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
        created_at: item.created_at || new Date().toISOString(),
      };
    });
  },

  // Create product
  create: async (data: Partial<Product>) => {
    return api.post('/products', data);
  },

  // Update product
  update: async (id: string | number, data: Partial<Product>) => {
    return api.put(`/products/${id}`, data);
  },

  // Delete product
  delete: async (id: string | number) => {
    return api.delete(`/products/${id}`);
  },
};