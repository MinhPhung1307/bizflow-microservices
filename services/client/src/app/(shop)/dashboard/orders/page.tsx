'use client';

import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';
import { formatCurrency } from '@/lib/utils';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns'; 
import { Loader2 } from 'lucide-react';

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: orderService.getAll,
  });

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  if (isError) return <div className="text-red-500 p-4">Không thể tải danh sách đơn hàng.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Lịch sử đơn hàng</h1>
      </div>

      <div className="border rounded-md bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Loại đơn</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order: any) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">#{order.id.slice(0, 8)}...</TableCell>
                <TableCell>{order.customer_name || 'Khách lẻ'}</TableCell>
                
                {/* SỬA LỖI 1: So sánh với 'counter' (chữ thường) */}
                <TableCell>
                   <Badge variant={order.order_type === 'counter' ? 'secondary' : 'outline'}>
                      {order.order_type === 'counter' ? 'Tại quầy' : 'Online'}
                   </Badge>
                </TableCell>

                {/* SỬA LỖI 2: Dùng biến is_debt để check Ghi nợ chuẩn xác nhất */}
                <TableCell>
                  {order.is_debt ? (
                      <span className="font-bold text-red-600">Ghi nợ</span>
                  ) : (
                      <span className="font-bold text-green-600">
                          {order.payment_method === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}
                      </span>
                  )}
                </TableCell>

                <TableCell className="text-right font-bold text-blue-600">
                  {formatCurrency(Number(order.total_price))}
                </TableCell>
                
                <TableCell className="text-sm text-gray-500">
                  {order.created_at ? format(new Date(order.created_at), 'dd/MM/yyyy HH:mm') : '-'}
                </TableCell>

                {/* SỬA LỖI 3: So sánh 'completed', 'pending' (chữ thường) */}
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                  }`}>
                      {order.status === 'completed' ? 'Hoàn thành' : 
                       order.status === 'pending' ? 'Chờ xử lý' : 
                       order.status === 'draft' ? 'Đơn nháp' :
                       order.status === 'cancelled' ? 'Đã hủy' : order.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}