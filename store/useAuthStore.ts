import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  category: string;
  id_card_front_url?: string;
  id_card_back_url?: string;
  status: string;
  guarantee_balance: number;
  is_approved: boolean;
  phone?: string;
  address?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isHydrated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => Promise<void>;
  setGuest: (guest: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isGuest: false,
      isHydrated: false,
      login: (userData, token) => set({
        user: userData,
        token,
        isAuthenticated: true,
        isGuest: false
      }),
      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (err) {}
        set({ user: null, token: null, isAuthenticated: false, isGuest: false });
      },
      setGuest: (guest) => set({ isGuest: guest }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      updateUser: (partialData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...partialData } });
        }
      },
    }),
    {
      name: 'subastasya-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

