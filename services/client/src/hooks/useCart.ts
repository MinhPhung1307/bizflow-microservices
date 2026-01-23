import { create } from 'zustand';
import { Product } from '@/types';

// Định nghĩa kiểu dữ liệu cho 1 item trong giỏ
export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],

  addToCart: (product) => set((state) => {
    const existing = state.cart.find((item) => item.id === product.id);
    if (existing) {
      // Nếu đã có thì tăng số lượng
      return {
        cart: state.cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ),
      };
    }
    // Nếu chưa có thì thêm mới
    return { cart: [...state.cart, { ...product, quantity: 1 }] };
  }),

  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter((item) => item.id !== productId),
  })),

  updateQuantity: (productId, quantity) => set((state) => ({
    cart: state.cart.map((item) => 
      item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
    ),
  })),

  clearCart: () => set({ cart: [] }),

  totalAmount: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  },
}));