import api from '@/lib/axios';

export interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
  address: string;
  total_debt: number;
  created_at: string;
}

export const customerService = {
  getCustomers: async (search?: string): Promise<Customer[]> => {
    const params = search ? { search } : {};
    const response = await api.get('/customers', { params });
    
    const rawData = response.data?.data || response.data || [];

    if (!Array.isArray(rawData)) return [];

    return rawData.map((item: any) => ({
      id: item.id,
      full_name: item.full_name, 
      phone_number: item.phone_number,
      address: item.address || '',
      // Map từ DB (total_outstanding_debt) -> Frontend (total_debt)
      total_debt: Number(item.total_outstanding_debt || 0), 
      created_at: item.created_at
    }));
  },

  createCustomer: async (data: Partial<Customer>) => {
    // Frontend gửi { full_name, ... } -> Controller nhận OK (vì ta đã xử lý trong Controller)
    const response = await api.post('/customers', data);
    return response.data;
  },

  updateCustomer: async (id: string, data: Partial<Customer>) => {
      const response = await api.put(`/customers/${id}`, data);
      return response.data;
  }
};