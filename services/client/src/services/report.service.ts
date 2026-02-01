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
    // 1. Lấy doanh thu hôm nay
    getDailyRevenue: async (): Promise<RevenueStats> => {
        // Gọi vào endpoint đã định nghĩa trong ReportController
        const response = await api.get('/reports/daily-revenue');
        return response.data?.data || { revenue: 0, growth: 0 };
    },

    // 2. Lấy báo cáo công nợ
    getDebtStats: async (): Promise<DebtStats> => {
        const response = await api.get('/reports/debt');
        return response.data?.data || { total_debt: 0, count: 0 };
    },

    // 3. Lấy cảnh báo tồn kho (sắp hết hàng)
    getLowStock: async (): Promise<LowStockItem[]> => {
        const response = await api.get('/reports/inventory/low-stock');
        return response.data?.data || [];
    },

    // 4. Lấy hoạt động gần đây (Đơn hàng mới nhất)
    getRecentActivities: async (limit = 5): Promise<RecentOrder[]> => {
        const response = await api.get(`/reports/recent-orders?limit=${limit}`);
        return response.data?.data || [];
    },

    // 5. Thống kê Phương thức thanh toán
    getTopOwners: async (): Promise<TopOwner[]> => {
        const response = await api.get('/reports/admin/stats/top-owners');
        return response.data || [];
    },

    // 6. Thống kê Phương thức thanh toán
    getPaymentMethodStats: async (): Promise<PaymentMethodStat[]> => {
        const response = await api.get('/reports/admin/stats/payment-methods');
        return response.data || [];
    },

    // 7. Thống kê Doanh thu theo Ngày trong tháng
    getDashboardStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/reports/admin/stats');
        return response.data;
    },

    // 8. Thống kê Doanh thu theo khoảng thời gian
    getRevenueStats: async (range: string): Promise<any[]> => {
        const response = await api.get(`/reports/admin/stats/revenue?range=${range}`);
        return response.data || [];
    },

    // 9. Thống kê Tăng trưởng theo khoảng thời gian
    getGrowthStats: async (range: string): Promise<any[]> => {
        const response = await api.get(`/reports/admin/stats/growth?range=${range}`);
        return response.data || [];
    },
};