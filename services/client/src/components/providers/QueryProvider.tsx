'use client'; // BẮT BUỘC

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Sử dụng useState để đảm bảo QueryClient chỉ được khởi tạo 1 lần duy nhất
  // và không bị mất đi khi component re-render
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Tùy chọn: data sẽ được cache trong 1 phút, không refetch khi focus cửa sổ
        staleTime: 60 * 1000, 
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}