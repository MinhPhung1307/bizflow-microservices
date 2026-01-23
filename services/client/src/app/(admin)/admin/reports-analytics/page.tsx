'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Wallet, CreditCard, Banknote } from 'lucide-react';

// Màu sắc cho biểu đồ tròn
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const PAYMENT_LABELS: Record<string, string> = {
    'CASH': 'Tiền mặt',
    'TRANSFER': 'Chuyển khoản',
    'DEBT': 'Ghi nợ'
};

export default function ReportsPage() {
  
  // 1. Fetch dữ liệu Phương thức thanh toán
  const { data: paymentStats = [] } = useQuery({
    queryKey: ['admin-stats-payment'],
    queryFn: async () => (await api.get('/admin/stats/payment-methods')).data
  });

  // 2. Fetch dữ liệu Top Owners
  const { data: topOwners = [] } = useQuery({
    queryKey: ['admin-stats-top-owners'],
    queryFn: async () => (await api.get('/admin/stats/top-owners')).data
  });

  // Chuẩn hóa dữ liệu cho PieChart
  const pieData = paymentStats.map((item: any) => ({
      name: PAYMENT_LABELS[item.payment_method] || item.payment_method,
      value: Number(item.value) // Dùng tổng tiền (value) hoặc số lượng đơn (count) tùy bạn
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Báo cáo & Phân tích chuyên sâu</h1>
        <p className="text-slate-500">Chi tiết về dòng tiền và hiệu suất người dùng</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* --- BIỂU ĐỒ 1: CƠ CẤU THANH TOÁN (PIE CHART) --- */}
        <Card>
            <CardHeader>
                <CardTitle>Cơ cấu nguồn tiền</CardTitle>
                <CardDescription>Phân bố doanh thu theo phương thức thanh toán</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full flex items-center justify-center">
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-slate-400 flex flex-col items-center">
                            <Wallet className="w-10 h-10 mb-2 opacity-20" />
                            Chưa có dữ liệu thanh toán
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>

        {/* --- BIỂU ĐỒ 2: TOP DOANH THU (BAR CHART NGANG HOẶC TABLE) --- */}
        {/* Ở đây tôi dùng Table kết hợp UI đẹp mắt */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Top Chủ Cửa Hàng Xuất Sắc
                </CardTitle>
                <CardDescription>5 Owner có tổng doanh số cao nhất toàn hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {topOwners.length > 0 ? (
                        topOwners.map((owner: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                        ${index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
                                          index === 1 ? 'bg-gray-200 text-gray-700 border border-gray-300' : 
                                          index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                                          'bg-slate-200 text-slate-600'}
                                    `}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800">{owner.full_name}</p>
                                        <p className="text-xs text-slate-500">{owner.phone_number}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-blue-600">{formatCurrency(Number(owner.total_revenue))}</p>
                                    <p className="text-xs text-slate-500">{owner.total_orders} đơn hàng</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-slate-400 py-10">
                            Chưa có dữ liệu xếp hạng
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Phần bổ sung: Thống kê nhanh dạng Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickStatCard 
            label="Giao dịch Tiền mặt" 
            value={formatCurrency(Number(paymentStats.find((x: any) => x.payment_method === 'CASH')?.value || 0))} 
            icon={Banknote} 
            color="text-green-600 bg-green-50"
          />
           <QuickStatCard 
            label="Giao dịch Chuyển khoản" 
            value={formatCurrency(Number(paymentStats.find((x: any) => x.payment_method === 'TRANSFER')?.value || 0))} 
            icon={CreditCard} 
            color="text-blue-600 bg-blue-50"
          />
           <QuickStatCard 
            label="Đang Ghi nợ" 
            value={formatCurrency(Number(paymentStats.find((x: any) => x.payment_method === 'DEBT')?.value || 0))} 
            icon={Wallet} 
            color="text-red-600 bg-red-50"
          />
      </div>
    </div>
  );
}

// Component con hiển thị thẻ nhỏ
function QuickStatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-full ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-lg font-bold text-slate-800">{value}</p>
            </div>
        </div>
    )
}