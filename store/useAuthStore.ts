import { create } from 'zustand';
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

const AUTH_STORAGE_KEY = 'subastasya-auth-v1';

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
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isGuest: false,
  isHydrated: false,

  login: (userData, token) => {
    set({
      user: userData,
      token,
      isAuthenticated: true,
      isGuest: false,
    });
    AsyncStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ user: userData, token, isAuthenticated: true })
    ).catch(() => {});
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {}
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {}
    set({ user: null, token: null, isAuthenticated: false, isGuest: false });
  },

  setGuest: (guest) => set({ isGuest: guest }),

  setHydrated: (hydrated) => set({ isHydrated: hydrated }),

  updateUser: (partialData) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...partialData };
      set({ user: updatedUser });
      const currentToken = get().token;
      AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user: updatedUser, token: currentToken, isAuthenticated: true })
      ).catch(() => {});
    }
  },

  initializeAuth: async () => {
    try {
      // 1. Try local cache first for instant hydration
      const cached = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed?.user) {
            set({
              user: parsed.user,
              token: parsed.token || null,
              isAuthenticated: true,
              isGuest: false,
            });
          }
        } catch (e) {}
      }

      // 2. Sync with Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          get().login(profile, session.access_token);
        }
      } else if (!cached) {
        set({ user: null, token: null, isAuthenticated: false });
      }
    } catch (err) {
      console.error('Error during auth initialization:', err);
    } finally {
      set({ isHydrated: true });
    }
  },
}));
