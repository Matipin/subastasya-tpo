-- Optimal Database Schema for Subastas Ya (Supabase PostgreSQL)
-- This schema removes redundant tables and leverages Supabase Auth for security.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    category TEXT DEFAULT 'bronze' CHECK (category IN ('bronze', 'silver', 'gold')),
    id_card_front_url TEXT,
    id_card_back_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure Profiles with Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Auctions Table
CREATE TABLE public.auctions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auctions are viewable by everyone." ON public.auctions FOR SELECT USING (true);

-- 3. Items Table
CREATE TABLE public.items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auction_id UUID REFERENCES public.auctions(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    history TEXT,
    starting_price NUMERIC(12, 2) NOT NULL,
    images TEXT[] NOT NULL DEFAULT '{}', -- Array of Storage URLs
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sold', 'rejected', 'in_auction')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items are viewable by everyone." ON public.items FOR SELECT USING (status IN ('approved', 'sold', 'in_auction'));
CREATE POLICY "Users can view their own items." ON public.items FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert their own items." ON public.items FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 4. Bids Table
CREATE TABLE public.bids (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    bidder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bids are viewable by everyone." ON public.bids FOR SELECT USING (true);
CREATE POLICY "Users can place bids." ON public.bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- 5. Debts Table (Penalties for unpaid bids)
CREATE TABLE public.debts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own debts." ON public.debts FOR SELECT USING (auth.uid() = user_id);

-- Utility functions and triggers to handle updated_at automatically
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_auctions_modtime
    BEFORE UPDATE ON public.auctions
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
