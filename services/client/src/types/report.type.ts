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

export interface DashboardStats {
    totalRevenue: number;
    totalOwners: number;
    activeOwners: number;
    totalPlans: number;
}

export interface PaymentMethodStat {
    payment_method: string;
    value: string | number;
}

export interface TopOwner {
    full_name: string;
    phone_number: string;
    total_orders: string | number;
    total_revenue: string | number;
}