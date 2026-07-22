import { Auction, User, Item, Debt } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data
const MOCK_USER: User = {
  id: 74,
  nombre: "Juan Perez",
  categoria: "oro",
  estado_cuenta: "activo",
  puede_pujar: true,
  metricas: {
    asistencias: 12,
    subastas_ganadas: 3,
    total_ofertado: 50000.00,
    total_pagado: 15000.00,
    deuda_pendiente: 0.00
  }
};

const MOCK_AUCTIONS: Auction[] = [
  {
    id: 1,
    titulo: "Colección Relojes Vintage",
    fecha_inicio: "2026-05-20T18:00:00Z",
    categoria_minima: "plata",
    moneda: "USD",
    rematador: "M. Martillero",
    status: 'active'
  },
  {
    id: 2,
    titulo: "Arte Moderno Argentino",
    fecha_inicio: "2026-06-15T19:00:00Z",
    categoria_minima: "comun",
    moneda: "ARS",
    rematador: "J. Rematador",
    status: 'upcoming'
  }
];

const MOCK_ITEMS: Record<number, Item[]> = {
  1: [
    {
      id: 55,
      numero_pieza: "A-123",
      descripcion: "Reloj de pulsera años 60.",
      historia: "Perteneció a la colección privada de la familia X.",
      fecha_creacion: "1965",
      artista: "Montblanc",
      precio_base: 1000000.00,
      dueño_actual: "Gomez, P.",
      imagenes: ["img1.jpg"],
      ubicacion_deposito: "Sede Central CABA"
    }
  ]
};

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      await delay(800);
      if (email === 'test@test.com' && password === '123456') {
        return { token: "eyJhbGciOiJIUzI1...", user_id: 74, categoria: "oro" };
      }
      throw new Error("Credenciales inválidas");
    },
    // Simular los demás auth
  },
  users: {
    getProfile: async () => {
      await delay(500);
      return MOCK_USER;
    },
    getDebts: async (): Promise<Debt[]> => {
      await delay(500);
      return [
         {
          id: 101,
          tipo: "multa_impago",
          concepto: "10% de oferta por Item #55 no abonada",
          monto: 1200.00,
          fecha_emision: "2026-04-20",
          limite_pago_72hs: "2026-04-23"
        }
      ];
    }
  },
  auctions: {
    getAll: async () => {
      await delay(500);
      return MOCK_AUCTIONS;
    },
    getById: async (id: number) => {
      await delay(500);
      return MOCK_AUCTIONS.find(a => a.id === id);
    },
    getCatalog: async (auctionId: number) => {
      await delay(500);
      return MOCK_ITEMS[auctionId] || [];
    }
  },
  items: {
    getById: async (itemId: number) => {
      await delay(500);
      return Object.values(MOCK_ITEMS).flat().find(i => i.id === itemId);
    }
  }
};
