import { create } from 'zustand';

export interface User {
  id: number;
  nombre: string;
  categoria: string;
  estado_cuenta: string;
  puede_pujar: boolean;
  metricas: {
    asistencias: number;
    subastas_ganadas: number;
    total_ofertado: number;
    total_pagado: number;
    deuda_pendiente: number;
  };
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
