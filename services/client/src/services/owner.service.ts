import api from '@/lib/axios';
import { Product } from '@/types';

export const ownerService = {
    
    // Lấy danh sách nhân viên
    getEmployees: async (search: string = '') => {
        const response = await api.get(`/owner/employees?search=${search}`);
        return response.data;
    },

    // Tạo nhân viên mới
    createEmployee: async (data: any) => {
        return api.post('/owner/employees', data);
    },

    // Khóa/Mở khóa tài khoản nhân viên
    toggleStaffStatus: async (id: string) => {
        return api.put(`/owner/employees/${id}/toggle-status`);
    },

    // Đổi mật khẩu nhân viên
    changeStaffPassword: async (id: string, data: any) => {
        return api.put(`/owner/employees/${id}/password`, data);
    },

    // Xóa nhân viên
    deleteEmployee: async (id: string) => {
        return api.delete(`/owner/employees/${id}`);
    },

    // Lấy nhật ký hoạt động
    getAuditLogs: async (search: string = '') => {
        const response = await api.get(`/owner/audit-logs?search=${search}`);
        return response.data;
    },

    // Xóa nhật ký hoạt động
    deleteAuditLog: async (id: string) => {
        return api.delete(`/owner/audit-logs/${id}`);
    },

    // Xóa toàn bộ nhật ký hoạt động
    clearAuditLogs: async () => {
        return api.delete('/owner/audit-logs/clear');
    },

    // Lấy tất cả đơn vị tính (UoM)
    getAllUoms: async () => {
        const response = await api.get('products/uoms/all');
        return response.data;
    },

    // Lấy đơn vị tính của sản phẩm
    getProductUoms: async (productId: String) => {
        const response = await api.get(`/products/${productId}/uoms`);
        return response.data;
    },

    // Lấy đơn vị tính trong kho của chủ shop
    getStoreUoms: async () => {
        const response = await api.get('products/uoms/store');
        return response.data;
    },

    // Nhập kho sản phẩm
    importStock: async (data: Object) => {
        return api.post('products/import', data);
    },

    // Gửi phản hồi đến Admin
    sendFeedback: async (data: { title: string; content: string }) => {
        const response = await api.post('/owner/feedbacks', data);
        return response.data;
    },
};