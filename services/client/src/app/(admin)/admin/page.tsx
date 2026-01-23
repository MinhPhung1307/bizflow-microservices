'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { adminService } from '@/services/admin.service';
import { formatCurrency } from '@/lib/utils';
import { Users, TrendingUp, CreditCard, Activity, Calendar } from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
  // 1. Tạo 2 state riêng biệt cho 2 biểu đồ
  const [revenueRange, setRevenueRange] = useState('7d');
  const [growthRange, setGrowthRange] = useState('7d');

  // Fetch số liệu tổng quan (Không ảnh hưởng bởi range)
  const { data: stats } = useQuery({
      queryKey: ['admin-stats'],
      queryFn: adminService.getDashboardStats,
  });

  // Fetch dữ liệu Biểu đồ Doanh thu (Theo revenueRange)
  const { data: revenueChartData = [] } = useQuery({
      queryKey: ['admin-chart-revenue', revenueRange],
      queryFn: async () => (await api.get(`/admin/stats/revenue?range=${revenueRange}`)).data
  });

  // Fetch dữ liệu Biểu đồ Tăng trưởng (Theo growthRange)
  const { data: growthChartData = [] } = useQuery({
      queryKey: ['admin-chart-growth', growthRange],
      queryFn: async () => (await api.get(`/admin/stats/growth?range=${growthRange}`)).data
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tổng quan hệ thống</h1>
        <p className="text-slate-500">Theo dõi hiệu suất và tăng trưởng</p>
      </div>

      {/* Cards thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Tổng Owner" value={stats?.totalOwners} icon={Users} color="text-blue-600" bg="bg-blue-50" />
          <StatCard title="Đang hoạt động" value={stats?.activeOwners} icon={Activity} color="text-green-600" bg="bg-green-50" />
          <StatCard title="Gói dịch vụ" value={stats?.totalPlans} icon={CreditCard} color="text-purple-600" bg="bg-purple-50" />
          <StatCard title="GMV Hệ thống" value={formatCurrency(stats?.totalRevenue || 0)} icon={TrendingUp} color="text-orange-600" bg="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* --- BIỂU ĐỒ 1: DOANH THU --- */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-semibold text-slate-800">Doanh thu hệ thống</h3>
                    <p className="text-xs text-slate-400 font-medium">Tổng giá trị giao dịch (GMV)</p>
                </div>
                {/* Nút chỉnh thời gian cho Doanh thu */}
                <TimeFilter value={revenueRange} onChange={setRevenueRange} />
              </div>
              
              <div className="h-[300px] w-full">
                {revenueChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueChartData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => val >= 1000000 ? `${val/1000000}M` : `${val/1000}K`} />
                            <Tooltip formatter={(value: any) => [formatCurrency(value ?? 0), "Doanh thu"]} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyState />
                )}
              </div>
          </div>

          {/* --- BIỂU ĐỒ 2: TĂNG TRƯỞNG USER --- */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-semibold text-slate-800">Tăng trưởng người dùng</h3>
                    <p className="text-xs text-slate-400 font-medium">Số lượng đăng ký mới</p>
                </div>
                {/* Nút chỉnh thời gian cho User */}
                <TimeFilter value={growthRange} onChange={setGrowthRange} />
              </div>
              
              <div className="h-[300px] w-full">
                {growthChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={growthChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="count" name="Thành viên mới" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                   <EmptyState />
                )}
              </div>
          </div>
      </div>
    </div>
  );
}

// Component chọn thời gian (Tái sử dụng)
function TimeFilter({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[110px] h-8 text-xs border-slate-200 bg-slate-50 focus:ring-0">
                <SelectValue placeholder="Chọn" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="7d">7 ngày qua</SelectItem>
                <SelectItem value="1m">Tháng này</SelectItem>
                <SelectItem value="1y">Năm này</SelectItem>
            </SelectContent>
        </Select>
    );
}

// Component trạng thái trống (Tái sử dụng)
function EmptyState() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <TrendingUp className="w-8 h-8 opacity-20" />
            <span className="text-sm">Chưa có dữ liệu trong khoảng thời gian này</span>
        </div>
    );
}

// StatCard (Giữ nguyên)
function StatCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className={`p-3 rounded-lg ${bg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <h4 className="text-2xl font-bold text-slate-800 mt-1">{value || 0}</h4>
            </div>
        </div>
    )
}