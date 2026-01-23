import api from '@/lib/axios';

export interface DashboardStats {
    totalRevenue: number;
    totalOwners: number;
    activeOwners: number;
    totalPlans: number;
}

export const adminService = {
    // Gọi API thật
    getDashboardStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    getOwners: async (status?: string) => {
        const response = await api.get('/admin/owners', {
            params: { status }
        });
        return response.data;
    }
};