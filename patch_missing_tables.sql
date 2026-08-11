-- ==========================================
-- SCRIPT: patch_missing_tables.sql
-- ==========================================

-- 1. Create item_proposals table
CREATE TABLE IF NOT EXISTS public.item_proposals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    history TEXT,
    images TEXT[] NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_review', 'appraised', 'accepted', 'rejected')),
    proposed_price NUMERIC(12, 2),
    admin_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for item_proposals
ALTER TABLE public.item_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own proposals" ON public.item_proposals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own proposals" ON public.item_proposals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own proposals" ON public.item_proposals FOR UPDATE USING (auth.uid() = user_id);

GRANT ALL ON TABLE public.item_proposals TO postgres, anon, authenticated, service_role;

-- 2. Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('CARD', 'BANK', 'CHEQUE')),
    card_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own payment methods" ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own payment methods" ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payment methods" ON public.payment_methods FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON TABLE public.payment_methods TO postgres, anon, authenticated, service_role;
