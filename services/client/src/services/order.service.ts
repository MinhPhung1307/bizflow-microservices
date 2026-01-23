import api from '@/lib/axios';
import { CreateOrderPayload, Order } from '@/types';

export const orderService = {
  create: async (payload: CreateOrderPayload) => {
    const response = await api.post('/orders', payload);
    return response.data;
  },

  // Thêm hàm này
  getAll: async (): Promise<Order[]> => {
    const response = await api.get('/orders');
    // Kiểm tra cấu trúc trả về (response.data.data hoặc response.data)
    return (response.data as any).data || response.data;
  },

  analyzeOrder: async (message: string) => {
    const response = await api.post('/orders/ai/draft', { message });
    return response.data; // Hoặc response.data.data tùy cấu trúc
}
};