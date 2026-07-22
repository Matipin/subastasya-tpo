-- ==========================================
-- ACTUALIZACIÓN DE ESQUEMA: LÓGICA DE NEGOCIOS AVANZADA
-- ==========================================

-- 1. Añadir campos al perfil de usuario
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guarantee_balance NUMERIC DEFAULT 0.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE; -- Automatizado para testing rápido

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

-- Corrección de permisos para que usuarios no logueados puedan ver el catálogo
GRANT SELECT ON public.items TO anon;
GRANT SELECT ON public.items TO authenticated;

-- Trigger para actualizar updated_at en item_proposals
CREATE TRIGGER update_item_proposals_modtime
    BEFORE UPDATE ON public.item_proposals
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ==========================================
-- ACTUALIZACIÓN: REGLAS AVANZADAS DE SUBASTAS
-- ==========================================

-- Añadir categoría mínima a subastas si no existe
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS minimum_category TEXT DEFAULT 'bronze' CHECK (minimum_category IN ('bronze', 'silver', 'gold', 'platinum'));

-- Tabla de Participantes de Subasta (Inscripciones)
CREATE TABLE IF NOT EXISTS public.auction_participants (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, auction_id)
);

ALTER TABLE public.auction_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura publica participants" ON public.auction_participants FOR SELECT USING (true);
CREATE POLICY "Permitir insercion participants a logueados" ON public.auction_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir delete participants a logueados" ON public.auction_participants FOR DELETE USING (auth.role() = 'authenticated');

-- Aumentar límites numéricos para soportar "montos exorbitantes" (ej. miles de millones)
ALTER TABLE public.items ALTER COLUMN starting_price TYPE NUMERIC(20, 2);
ALTER TABLE public.bids ALTER COLUMN amount TYPE NUMERIC(20, 2);
ALTER TABLE public.profiles ALTER COLUMN guarantee_balance TYPE NUMERIC(20, 2);

-- ==========================================
-- FUNCIONES DE NEGOCIO: MULTAS DEL 10%
-- ==========================================

-- Función para generar una multa si el ganador no posee fondos al finalizar
CREATE OR REPLACE FUNCTION generate_fine_for_unpaid_bid(bid_id UUID)
RETURNS VOID AS $$
DECLARE
    target_bid public.bids%ROWTYPE;
    fine_amount NUMERIC(20, 2);
BEGIN
    -- Obtener la puja
    SELECT * INTO target_bid FROM public.bids WHERE id = bid_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Puja no encontrada';
    END IF;

    -- Calcular el 10% de recargo (multa)
    fine_amount := target_bid.amount * 0.10;

    -- Generar la deuda
    INSERT INTO public.debts (user_id, amount, reason, status)
    VALUES (
        target_bid.bidder_id, 
        fine_amount, 
        'Multa del 10% por falta de fondos para lote subastado (Puja original: $' || target_bid.amount || ')',
        'pending'
    );
END;
$$ LANGUAGE plpgsql;
