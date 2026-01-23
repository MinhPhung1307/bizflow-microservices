'use client';

import React from 'react';
import { TrendingUp, Users, AlertCircle, ChevronRight, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { REVENUE_DATA } from '@/lib/constants';

export const Dashboard = () => (
  <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Cards thống kê */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-sm font-medium">Doanh thu hôm nay</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-2">{formatCurrency(6100000)}</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-xl text-green-600">
            <TrendingUp size={28} />
          </div>
        </div>
        <div className="mt-4 text-sm text-green-600 flex items-center font-medium bg-green-50 w-fit px-2 py-1 rounded">
          <ChevronRight size={16} /> +12% so với hôm qua
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-sm font-medium">Tổng nợ phải thu</p>
            <h3 className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(18000000)}</h3>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-red-600">
            <Users size={28} />
          </div>
        </div>
        <div className="mt-4 text-sm text-red-600 font-medium bg-red-50 w-fit px-2 py-1 rounded">
          3 khách nợ quá hạn
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-sm font-medium">Cảnh báo tồn kho</p>
            <h3 className="text-3xl font-bold text-orange-500 mt-2">2 SP</h3>
          </div>
          <div className="p-3 bg-orange-50 rounded-xl text-orange-500">
            <AlertCircle size={28} />
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-500">
          Sơn Dulux, Cát vàng sắp hết
        </div>
      </div>
    </div>

    {/* Biểu đồ */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-800">Doanh thu & Chi phí (Tuần này)</h3>
                 <select className="text-sm border border-slate-200 rounded-lg p-1 bg-slate-50">
                     <option>7 ngày qua</option>
                     <option>Tháng này</option>
                 </select>
            </div>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REVENUE_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000000}Tr`} />
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

        {/* Hoạt động gần đây */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Hoạt động gần đây</h3>
             <div className="space-y-4">
                 {[1,2,3,4,5].map((i) => (
                     <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                         <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 text-xs font-bold">
                             DH{i}
                         </div>
                         <div>
                             <p className="text-sm font-medium text-slate-800">Bán 5 bao xi măng cho Anh Ba</p>
                             <p className="text-xs text-slate-500">10 phút trước • <span className="text-green-600">Đã thanh toán</span></p>
                         </div>
                     </div>
                 ))}
             </div>
             <button className="w-full mt-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 font-medium">Xem tất cả</button>
        </div>
    </div>
  </div>
);