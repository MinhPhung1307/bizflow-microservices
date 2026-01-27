import api from '@/lib/axios';

// Định nghĩa kiểu dữ liệu (Interface) cho TypeScript
export interface RevenueStats {
    revenue: number;
    growth: number; // Tỉ lệ tăng trưởng
}

export interface DebtStats {
    total_debt: number;
    count: number; // Số lượng khách nợ
}

export interface LowStockItem {
    id: string;
    name: string;
    stock: number;
    unit: string;
}

export interface RecentOrder {
    id: string;
    customer_name: string;
    total_price: number;
    status: string;
    created_at: string;
}

export const reportService = {
    // 1. Lấy doanh thu hôm nay
    getDailyRevenue: async () => {
        // Gọi vào endpoint đã định nghĩa trong ReportController
        const response = await api.get('/reports/daily-revenue');
        return response.data?.data || { revenue: 0, growth: 0 };
    },

    // 2. Lấy báo cáo công nợ
    getDebtStats: async () => {
        const response = await api.get('/reports/debt');
        return response.data?.data || { total_debt: 0, count: 0 };
    },

    // 3. Lấy cảnh báo tồn kho (sắp hết hàng)
    getLowStock: async () => {
        const response = await api.get('/reports/inventory/low-stock');
        return response.data?.data || [];
    },

    // 4. Lấy hoạt động gần đây (Đơn hàng mới nhất)
    getRecentActivities: async (limit = 5) => {
        const response = await api.get(`/reports/recent-orders?limit=${limit}`);
        return response.data?.data || [];
    }
};