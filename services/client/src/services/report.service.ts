import api from '@/lib/axios';
import { 
    DashboardStats, 
    DebtStats, 
    LowStockItem, 
    RecentOrder, 
    RevenueStats,
    PaymentMethodStat,
    TopOwner 
} from '@/types/report.type';

export const reportService = {
    //  --- API CHO QUẢN TRỊ VIÊN (ADMIN) ---

   admin: {
        // 1. Thống kê Doanh thu theo Ngày trong tháng
        getDashboardStats: async (): Promise<DashboardStats> => {
            const response = await api.get('/reports/admin/stats');
            return response.data;
        }, 

        // 2. Thống kê Doanh thu theo khoảng thời gian
        getRevenueStats: async (range: string): Promise<any[]> => {
            const response = await api.get(`/reports/admin/stats/revenue?range=${range}`);
            return response.data || [];
        },

        // 3. Thống kê Tăng trưởng theo khoảng thời gian
        getGrowthStats: async (range: string): Promise<any[]> => {
            const response = await api.get(`/reports/admin/stats/growth?range=${range}`);
            return response.data || [];
        },

        // 4. Thống kê Phương thức thanh toán
        getPaymentMethodStats: async (): Promise<PaymentMethodStat[]> => {
            const response = await api.get('/reports/admin/stats/payment-methods');
            return response.data || [];
        },

        // 5. Thống kê Phương thức thanh toán
        getTopOwners: async (): Promise<TopOwner[]> => {
            const response = await api.get('/reports/admin/stats/top-owners');
            return response.data || [];
        },
   },

    //  --- API CHO CHỦ CỬA HÀNG (OWNER) ---

    owner: {
        // 1. Lấy doanh thu hôm nay
        getDailyRevenue: async (): Promise<RevenueStats> => {
            // Gọi vào endpoint đã định nghĩa trong ReportController
            const response = await api.get('/reports/owner/daily-revenue');
            return response.data?.data || { revenue: 0, growth: 0 };
        },

        // 2. Lấy báo cáo công nợ
        getDebtStats: async (): Promise<DebtStats> => {
            const response = await api.get('/reports/owner/debt');
            return response.data?.data || { total_debt: 0, count: 0 };
        },

        // 3. Lấy cảnh báo tồn kho (sắp hết hàng)
        getLowStock: async (): Promise<LowStockItem[]> => {
            const response = await api.get('/reports/owner/inventory/low-stock');
            return response.data?.data || [];
        },

        // 4. Lấy báo cáo doanh thu theo khoảng thời gian
        getRevenueStats: async (range: string): Promise<any[]> => {
            const response = await api.get(`/reports/owner/stats/revenue?range=${range}`);
            return response.data?.data || [];
        },

        // 5. Lấy hoạt động gần đây (Đơn hàng mới nhất)
        getRecentActivities: async (limit = 5): Promise<RecentOrder[]> => {
            const response = await api.get(`/reports/owner/recent-orders?limit=${limit}`);
            return response.data?.data || [];
        },
    }
};