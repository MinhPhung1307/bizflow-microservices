import { create } from "zustand";
import { userService } from "@/services/user.service";
import { UserProfile } from "@/types";

interface UserState {
  user: UserProfile | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  setUser: (user: UserProfile) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,

  fetchUser: async () => {
    set({ loading: true });
    try {
      const data = await userService.getProfile();
      set({ user: data, loading: false });
    } catch (error) {
      console.error("Failed to fetch user", error);
      set({ user: null, loading: false });
    }
  },

  setUser: (user) => set({ user }),
}));
