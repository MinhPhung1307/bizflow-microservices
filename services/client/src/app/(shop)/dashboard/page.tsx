'use client';

import React from 'react';
import { TrendingUp, Users, AlertCircle, ChevronRight, PackageX } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/report.service'; // Đảm bảo bạn đã tạo file này ở bước trước
import AIOrderCreator from '@/components/AIOrderCreator';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function DashboardPage() {
  const [range, setRange] = React.useState('7d');
  // 1. Fetch Doanh thu hôm nay
  const { data: revenueData, isLoading: loadRevenue } = useQuery({
      queryKey: ['dashboard-revenue'],
      queryFn: reportService.owner.getDailyRevenue,
  });

  // 2. Fetch Công nợ
  const { data: debtData, isLoading: loadDebt } = useQuery({
      queryKey: ['dashboard-debt'],
      queryFn: reportService.owner.getDebtStats,
  });

  // 3. Fetch Cảnh báo tồn kho
  const { data: lowStockData, isLoading: loadStock } = useQuery({
      queryKey: ['dashboard-low-stock'],
      queryFn: reportService.owner.getLowStock,
  });

  // 4. Fetch Biểu đồ Doanh thu & Chi phí (theo range)
  const { data: chartData = [], isLoading: loadWeekly } = useQuery({
      queryKey: ['dashboard-revenue-cost', range],
      queryFn: () => reportService.owner.getRevenueStats(range), // range ở đây là '7d', '1m', hoặc '1y'
  });

  // 5. Fetch Hoạt động gần đây
  const { data: recentActivities, isLoading: loadActivities } = useQuery({
      queryKey: ['dashboard-recent'],
      queryFn: () => reportService.owner.getRecentActivities(5),
  });

  // Hàm hiển thị tóm tắt hàng tồn kho
  const getLowStockSummary = () => {
      if (!lowStockData || lowStockData.length === 0) return "Kho ổn định";
      const names = lowStockData.slice(0, 2).map((p: any) => p.name).join(', ');
      return lowStockData.length > 2 ? `${names} và ${lowStockData.length - 2} SP khác` : names;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* --- Card 1: Doanh thu --- */}
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

        {/* --- Card 2: Công nợ --- */}
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

        {/* --- Card 3: Tồn kho --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium">Cảnh báo tồn kho (&lt;100 đơn vị)</p>
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

      {/* --- Biểu đồ & List --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Biểu đồ Doanh thu (Mock Data) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-800">Doanh thu & Chi phí</h3>
              <select 
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 hover:bg-slate-100 transition-colors outline-none focus:ring-2 focus:ring-blue-500/20" 
                value={range} 
                onChange={(e) => setRange(e.target.value)}
              >
                <option value="7d">7 ngày qua</option>
                <option value="1m">1 Tháng qua</option>
                <option value="1y">Năm nay</option>
              </select>
            </div>

            <div className="h-72 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tickMargin={12} 
                    style={{ fontSize: '11px', fill: '#64748b', fontWeight: 500 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => `${(val/1000000).toFixed(0)}Tr`}
                    style={{ fontSize: '11px', fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(val: any) => [formatCurrency(val), ""]}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 500 }} 
                    iconType="circle"
                  />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={range === '7d' ? 25 : 12} />
                  <Bar dataKey="cost" name="Chi phí" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={range === '7d' ? 25 : 12} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-around relative">
              {/* Doanh thu */}
              <div className="flex flex-col items-center text-center flex-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  Dòng tiền vào
                </span>
                <span className="text-xl font-extrabold text-blue-600">
                  {formatCurrency(chartData.reduce((acc, curr) => acc + (curr.revenue || 0), 0))}
                </span>
                <span className="text-[11px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full mt-2 font-medium">
                  Tổng doanh thu
                </span>
              </div>

              <div className="h-12 w-[1px] bg-slate-200 hidden md:block"></div>

              {/* Chi phí */}
              <div className="flex flex-col items-center text-center flex-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  Vốn lưu động
                </span>
                <span className="text-xl font-extrabold text-slate-700">
                  {formatCurrency(chartData.reduce((acc, curr) => acc + (curr.cost || 0), 0))}
                </span>
                <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-2 font-medium">
                  Chi tiêu nhập hàng
                </span>
              </div>
            </div>
          </div>

          {/* Hoạt động gần đây (Real Data) */}
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
                   Xem tất cả
               </button>
          </div>
      </div>
      
      {/* AI Assistant */}
      <div className="min-h-screen py-10">
        <AIOrderCreator />
      </div>
    </div>
  );
}