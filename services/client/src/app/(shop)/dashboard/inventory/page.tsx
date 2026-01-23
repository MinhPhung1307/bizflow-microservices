// client/src/app/(shop)/dashboard/inventory/page.tsx
'use client';
import { InventoryManager } from "@/components/features/Inventory";
// import { formatCurrency } from '@/lib/utils'; // Hãy dùng nếu đã có

export default function InventoryPage() {
  return (
    <InventoryManager />
  );
}