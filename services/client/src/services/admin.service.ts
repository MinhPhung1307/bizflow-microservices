import api from '@/lib/axios';

export const adminService = {
    getOwners: async (status?: string) => {
        const response = await api.get('/admin/owners', {
            params: { status }
        });
        return response.data;
    }
};