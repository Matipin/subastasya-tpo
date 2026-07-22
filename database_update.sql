-- ==========================================
-- ACTUALIZACIÓN DE ESQUEMA: LÓGICA DE NEGOCIOS AVANZADA
-- ==========================================

-- 1. Añadir saldo de garantía al perfil de usuario
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guarantee_balance NUMERIC DEFAULT 0.00;

-- 2. Métodos de Pago
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(255) NOT NULL, -- ej. 'Visa', 'Mastercard'
    card_number VARCHAR(50) NOT NULL, -- enmascarado ej. '**** 4242'
    type VARCHAR(50) NOT NULL, -- 'CARD' o 'BANK'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Propuestas de Artículos (Tasaciones)
CREATE TABLE IF NOT EXISTS public.item_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    history TEXT,
    images TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'pending_review', -- pending_review, appraised, accepted, rejected
    proposed_price NUMERIC DEFAULT NULL, -- El precio tasado por la empresa
    admin_feedback TEXT, -- Mensaje del admin (ej. "Muy buen estado")
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Multas y Deudas
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Transacciones Financieras (Ventas y Comisiones)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID, -- Referencia al item vendido
    type VARCHAR(50) NOT NULL, -- 'sale' (venta), 'commission' (comisión empresa), 'fine' (multa pagada)
    amount NUMERIC NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Opcional, en este mockup las dejaremos públicas para pruebas o añadiremos politicas basicas)
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo rápido (en producción usar auth.uid() = user_id)
CREATE POLICY "Permitir todo a autenticados en payment_methods" ON public.payment_methods FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir todo a autenticados en item_proposals" ON public.item_proposals FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir todo a autenticados en debts" ON public.debts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir todo a autenticados en transactions" ON public.transactions FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para actualizar updated_at en item_proposals
CREATE TRIGGER update_item_proposals_modtime
    BEFORE UPDATE ON public.item_proposals
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
