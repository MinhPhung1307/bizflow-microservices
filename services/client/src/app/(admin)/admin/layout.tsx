import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar'; 
import AdminHeader from '@/components/admin/AdminHeader'; 

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar cố định bên trái */}
      <AdminSidebar />
      
      {/* Nội dung chính bên phải */}
      <div className="ml-64 flex flex-col min-h-screen">
         {/* Header nằm trên cùng */}
         <AdminHeader /> 
         
         <main className="p-6 md:p-8 flex-1">
            {children}
         </main>
      </div>
    </div>
  );
}