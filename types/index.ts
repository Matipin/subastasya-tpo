export interface Auction {
  id: number;
  titulo: string;
  fecha_inicio: string;
  categoria_minima: string;
  moneda: string;
  rematador: string;
  status?: 'active' | 'upcoming' | 'ended';
  items?: Item[];
}

export interface Item {
  id: number;
  numero_pieza: string;
  descripcion: string;
  historia?: string;
  fecha_creacion?: string;
  artista?: string;
  precio_base: number;
  dueño_actual: string;
  imagenes: string[];
  ubicacion_deposito?: string;
  estado?: 'aprobado' | 'vendido' | 'pendiente' | 'rechazado';
}

export interface Bid {
  monto_actual: number;
  puja_minima: number;
  puja_maxima?: number;
  ultimo_postor: string;
  tiempo_restante?: string;
}

export interface Debt {
  id: number;
  tipo: string;
  concepto: string;
  monto: number;
  fecha_emision: string;
  limite_pago_72hs?: string;
}

export interface PaymentMethod {
  id: number;
  type: 'CARD' | 'BANK' | 'CHECK';
  provider: string;
  number: string;
  expiration_date?: string;
  is_default?: boolean;
}
