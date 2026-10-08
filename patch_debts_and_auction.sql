-- ================================================================
-- SCRIPT: patch_debts_and_auction.sql
-- Ejecutar en Supabase SQL Editor para habilitar permisos en 'debts'
-- ================================================================

-- 1. Permisos para la tabla debts
GRANT ALL ON TABLE public.debts TO postgres, anon, authenticated, service_role;

-- 2. Habilitar RLS y políticas
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own debts." ON public.debts;
CREATE POLICY "Users can view own debts." ON public.debts 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own debts." ON public.debts;
CREATE POLICY "Users can insert own debts." ON public.debts 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own debts." ON public.debts;
CREATE POLICY "Users can update own debts." ON public.debts 
FOR UPDATE USING (auth.uid() = user_id);

-- 3. Habilitar Realtime en la tabla bids (para sincronización instantánea)
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
