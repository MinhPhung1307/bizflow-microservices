'use client';

import React from 'react';
import { TrendingUp, Users, AlertCircle, ChevronRight, PackageX } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { REVENUE_DATA } from '@/lib/constants'; // Dữ liệu biểu đồ tạm thời (nếu chưa có API chart)
import { reportService } from '@/services/report.service';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export const Dashboard = () => {
    // --- 1. FETCH DATA TỪ BACKEND ---
    
    // Doanh thu
    const { data: revenueData, isLoading: loadRevenue } = useQuery({
        queryKey: ['dashboard-revenue'],
        queryFn: reportService.getDailyRevenue,
    });

    // Công nợ
    const { data: debtData, isLoading: loadDebt } = useQuery({
        queryKey: ['dashboard-debt'],
        queryFn: reportService.getDebtStats,
    });

    // Tồn kho
    const { data: lowStockData, isLoading: loadStock } = useQuery({
        queryKey: ['dashboard-low-stock'],
        queryFn: reportService.getLowStock,
    });

    // Hoạt động gần đây
    const { data: recentActivities, isLoading: loadActivities } = useQuery({
        queryKey: ['dashboard-recent'],
        queryFn: () => reportService.getRecentActivities(5),
    });

    // Hàm hiển thị tóm tắt hàng tồn kho
    const getLowStockSummary = () => {
        if (!lowStockData || lowStockData.length === 0) return "Kho ổn định";
        const names = lowStockData.slice(0, 2).map((p: any) => p.name).join(', ');
        return lowStockData.length > 2 ? `${names} và ${lowStockData.length - 2} SP khác` : names;
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
            {/* --- PHẦN CARDS THỐNG KÊ --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* CARD 1: DOANH THU */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Doanh thu hôm nay</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">
                                {loadRevenue ? '...' : formatCurrency(revenueData?.revenue || 0)}
                            </h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <TrendingUp size={28} />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-green-600 flex items-center font-medium bg-green-50 w-fit px-2 py-1 rounded">
                        <ChevronRight size={16} /> Hôm nay
                    </div>
                </div>

                {/* CARD 2: CÔNG NỢ */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Tổng nợ phải thu</p>
                            <h3 className="text-3xl font-bold text-red-600 mt-2">
                                {loadDebt ? '...' : formatCurrency(debtData?.total_debt || 0)}
                            </h3>
                        </div>
                        <div className="p-3 bg-red-50 rounded-xl text-red-600">
                            <Users size={28} />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-red-600 font-medium bg-red-50 w-fit px-2 py-1 rounded">
                        {loadDebt ? '...' : `${debtData?.count || 0} khách đang nợ`}
                    </div>
                </div>

                {/* CARD 3: CẢNH BÁO KHO */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Cảnh báo tồn kho</p>
                            <h3 className="text-3xl font-bold text-orange-500 mt-2">
                                {loadStock ? '...' : `${lowStockData?.length || 0} SP`}
                            </h3>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-xl text-orange-500">
                            <AlertCircle size={28} />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-slate-500 truncate" title={getLowStockSummary()}>
                        {loadStock ? 'Đang tải...' : getLowStockSummary()}
                    </div>
                </div>
            </div>

            {/* --- PHẦN BIỂU ĐỒ & LIST --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* BIỂU ĐỒ (Hiện tại dùng dữ liệu tĩnh, chờ API Chart) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Doanh thu & Chi phí</h3>
                        <span className="text-xs text-slate-400 italic">(Biểu đồ mẫu)</span>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={REVENUE_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000000}Tr`} />
                                <Tooltip
                                    formatter={(val: any) => formatCurrency(val)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="revenue" name="Doanh thu" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="cost" name="Chi phí" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* LIST HOẠT ĐỘNG GẦN ĐÂY */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Hoạt động gần đây</h3>
                    <div className="space-y-4">
                        {loadActivities ? (
                            <div className="text-center text-slate-400 py-4 text-sm">Đang tải dữ liệu...</div>
                        ) : recentActivities?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                                <PackageX size={32} />
                                <span className="text-sm">Chưa có đơn hàng nào</span>
                            </div>
                        ) : (
                            recentActivities?.map((order: any) => (
                                <div key={order.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 text-xs font-bold">
                                        DH
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">
                                            {order.customer_name || 'Khách lẻ'}
                                        </p>
                                        <p className="text-xs font-bold text-blue-600 mt-0.5">
                                            {formatCurrency(Number(order.total_price))}
                                        </p>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-[10px] text-slate-400">
                                                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: vi })}
                                            </p>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {order.status === 'completed' ? 'Xong' : order.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <button className="w-full mt-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 font-medium transition-colors">
                        Xem tất cả đơn hàng
                    </button>
                </div>
            </div>
        </div>
    );
};