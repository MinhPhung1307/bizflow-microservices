'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Clock, Trash2, CheckCircle2 } from 'lucide-react';

interface DraftOrderListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drafts: any[];
  onSelect: (draft: any) => void;
  onDelete: (id: string) => void;
}

export default function DraftOrderList({ open, onOpenChange, drafts, onSelect, onDelete }: DraftOrderListProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="text-orange-500" /> Danh sách đơn nháp
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {drafts.length === 0 ? (
            <div className="text-center py-10 text-slate-400">Không có đơn hàng nháp nào.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => (
                  <TableRow key={draft.id}>
                    <TableCell className="font-mono text-xs">{draft.code || draft.id.toString().slice(0,8)}</TableCell>
                    <TableCell>{draft.customer_name || 'Khách lẻ'}</TableCell>
                    <TableCell className="font-bold text-blue-600">
                        {formatCurrency(Number(draft.total_price))}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                        {new Date(draft.created_at).toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="h-8 w-8 p-0"
                        onClick={() => onDelete(draft.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-8 bg-green-600 hover:bg-green-700"
                        onClick={() => onSelect(draft)}
                      >
                        <CheckCircle2 size={14} className="mr-1" /> Chọn
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}