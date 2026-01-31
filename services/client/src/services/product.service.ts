import api from '@/lib/axios';
import { Product } from '@/types';

export const productService = {
  getAll: async (params?: any): Promise<any[]> => {
    try {
      const response = await api.get('/products', { params });
      
      const rawData = response.data?.products || response.data?.data || [];
      
      if (!Array.isArray(rawData)) return [];

      return rawData.map((item: any) => {
        // Hàm an toàn: Chuyển mọi thứ thành chuỗi, né object/null
        const safeString = (val: any) => {
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return JSON.stringify(val); // Convert object thành string thay vì trả về rỗng để debug
            return String(val);
        };

        // Hàm xử lý ảnh
        let imageUrl = '';
        if (Array.isArray(item.images) && item.images.length > 0) {
            imageUrl = item.images[0];
        } else if (typeof item.images === 'string' && item.images.startsWith('http')) {
            imageUrl = item.images;
        }

        return {
          id: safeString(item.id || Math.random().toString()), // Fallback random nếu mất ID
          owner_id: safeString(item.owner_id),
          
          name: safeString(item.name),
          code: safeString(item.code || '---'),
          unit: safeString(item.unit || item.uom_name || 'Cái'),
          
          price_sales: Number(item.price || item.price_sales || 0),
          stock_quantity: Number(item.stock || item.stock_quantity || 0),
          
          image_url: imageUrl,
          
          // Giữ các trường khác an toàn
          price: Number(item.price || 0),
          stock: Number(item.stock || 0),
          category: safeString(item.category),
          is_active: Boolean(item.is_active),
          created_at: item.created_at
        };
      });
    } catch (error) {
      console.error("Fetch products error:", error);
      return [];
    }
  },

  create: async (data: Partial<Product>) => api.post('/products', data),
  update: async (id: string | number, data: Partial<Product>) => api.put(`/products/${id}`, data),
  delete: async (id: string | number) => api.delete(`/products/${id}`),
};