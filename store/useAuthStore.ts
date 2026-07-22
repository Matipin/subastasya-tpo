import { create } from 'zustand';

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
  login: (userData: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (userData, token) => set({ user: userData, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
