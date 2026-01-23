import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// [CẬP NHẬT] Hàm format tiền tệ "Hardcore" - Dùng Regex
export function formatCurrency(amount: number | string) {
  // 1. Chuyển đổi sang số
  const value = Number(amount);
  
  // 2. Nếu không phải số hợp lệ, trả về 0
  if (isNaN(value)) return '0 ';

  // 3. Làm tròn xuống để CẮT BỎ hoàn toàn phần thập phân (.00)
  const integerPart = Math.floor(value);

  // 4. Dùng Regex để chèn dấu chấm (.) sau mỗi 3 chữ số
  // Ví dụ: 1000000 -> 1.000.000
  const formatted = integerPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${formatted} `;
}