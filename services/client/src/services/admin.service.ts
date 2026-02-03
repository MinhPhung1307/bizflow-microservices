import api from '@/lib/axios';

export const adminService = {
    // Lấy danh sách Owner với trạng thái tùy chọn
    getOwners: async (status?: string) => {
        const response = await api.get('/admin/owners', {
            params: { status }
        });
        return response.data;
    },

    // Lấy danh sách phản hồi
    getFeedbacks: async () => {
        const response = await api.get('/admin/feedbacks');
        return response.data;
    },

    // Cập nhật trạng thái phản hồi
    updateFeedback: async (id: number, data: {status: string, admin_note: string}) => {
        return await api.put(`/admin/feedbacks/${id}`, data);
    },

    // Lấy số lượng phản hồi đang chờ xử lý
    getPendingFeedbackCount: async () => {
        const response = await api.get('/admin/feedbacks/count');
        return response.data; // Trả về { count: x }
    },

    // Xóa phản hồi
    deleteFeedback: async (id: number) => {
        const response = await api.delete(`/admin/feedbacks/${id}`);
        return response.data;
    },

    // Lấy danh sách mẫu báo cáo (Khớp với backend router.get('/templates'))
    getReportTemplates: async () => {
        const response = await api.get('/admin/templates');
        return response.data;
    },

    // Cập nhật mẫu báo cáo (Khớp với backend router.put('/templates/:id'))
    updateReportTemplate: async (id: number, data: any) => {
        const response = await api.put(`/admin/templates/${id}`, data);
        return response.data;
    },

    // Tạo mới mẫu báo cáo (Khớp với backend router.post('/templates'))
    createReportTemplate: async (data: any) => {
        const response = await api.post('/admin/templates', data);
        return response.data;
    }
};