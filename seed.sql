-- =========================================================================
-- SCRIPT DE SEMILLA PARA PRUEBAS (SubastasYa)
-- =========================================================================
-- Instrucciones: Pega este código completo en el SQL Editor de Supabase y ejecútalo (Run).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Restricción de categorías
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_category_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_category_check CHECK (category IN ('bronze', 'silver', 'gold', 'platinum'));

-- 2. Asegurar columnas y tablas requeridas
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS minimum_category TEXT DEFAULT 'bronze';

CREATE TABLE IF NOT EXISTS public.auction_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    auction_id UUID REFERENCES public.auctions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, auction_id)
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('CARD', 'BANK', 'CHEQUE')),
    card_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PERMISOS
GRANT ALL ON TABLE public.profiles TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.auctions TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.items TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.auction_participants TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.bids TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.debts TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.payment_methods TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.transactions TO postgres, service_role, authenticated, anon;

-- 4. POLÍTICAS RLS
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bids are viewable by everyone." ON public.bids;
CREATE POLICY "Bids are viewable by everyone." ON public.bids FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can place bids." ON public.bids;
CREATE POLICY "Users can place bids." ON public.bids FOR INSERT WITH CHECK (true);

DO $$ 
DECLARE 
    admin_id uuid := gen_random_uuid();
    comun_id uuid := gen_random_uuid();
    oro_id uuid := gen_random_uuid();
    platino_id uuid := gen_random_uuid();
    
    auction1_id uuid := gen_random_uuid();
    auction2_id uuid := gen_random_uuid();
    auction3_id uuid := gen_random_uuid();
    auction4_id uuid := gen_random_uuid();
    auction5_id uuid := gen_random_uuid();

    item_reloj uuid := gen_random_uuid();
    item_mustang uuid := gen_random_uuid();
    item_cuadro uuid := gen_random_uuid();
    item_joya uuid := gen_random_uuid();
    item_jarron uuid := gen_random_uuid();
    item_guitarra uuid := gen_random_uuid();
BEGIN
    -- Limpieza previa
    DELETE FROM public.bids;
    DELETE FROM public.auction_participants;
    DELETE FROM public.items;
    DELETE FROM public.auctions;
    DELETE FROM auth.users WHERE email IN ('admin@subastasya.com', 'testcomun@test.com', 'testoro@test.com', 'testplatino@test.com');

    -- Crear usuarios Auth
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES 
    (admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@subastasya.com', crypt('123456', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', NOW(), NOW()),
    (comun_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'testcomun@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', NOW(), NOW()),
    (oro_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'testoro@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', NOW(), NOW()),
    (platino_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'testplatino@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', NOW(), NOW());

    -- Crear identidades Auth
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
    VALUES
    (gen_random_uuid(), admin_id, admin_id::text, format('{"sub":"%s","email":"%s"}', admin_id::text, 'admin@subastasya.com')::jsonb, 'email', NOW(), NOW()),
    (gen_random_uuid(), comun_id, comun_id::text, format('{"sub":"%s","email":"%s"}', comun_id::text, 'testcomun@test.com')::jsonb, 'email', NOW(), NOW()),
    (gen_random_uuid(), oro_id, oro_id::text, format('{"sub":"%s","email":"%s"}', oro_id::text, 'testoro@test.com')::jsonb, 'email', NOW(), NOW()),
    (gen_random_uuid(), platino_id, platino_id::text, format('{"sub":"%s","email":"%s"}', platino_id::text, 'testplatino@test.com')::jsonb, 'email', NOW(), NOW());

    -- Perfiles
    INSERT INTO public.profiles (id, email, first_name, last_name, category, is_approved, guarantee_balance)
    VALUES 
    (admin_id, 'admin@subastasya.com', 'SubastasYa', 'Tesorería', 'platinum', true, 1000000000),
    (comun_id, 'testcomun@test.com', 'Usuario', 'Comun', 'bronze', true, 100000),
    (oro_id, 'testoro@test.com', 'Usuario', 'Oro', 'gold', true, 500000),
    (platino_id, 'testplatino@test.com', 'Usuario', 'Platino', 'platinum', true, 1500000);

    -- 2 Subastas activas hoy
    INSERT INTO public.auctions (id, title, start_date, end_date, minimum_category, status)
    VALUES 
    (auction1_id, 'Subasta Exclusiva de Lujo en Vivo', NOW() - interval '30 minutes', NOW() + interval '2 hours', 'bronze', 'active'),
    (auction2_id, 'Gran Subasta de Autos Clásicos y Arte', NOW() - interval '15 minutes', NOW() + interval '3 hours', 'bronze', 'active'),
    (auction3_id, 'Subasta de Alta Joyería y Gemas Preciosas', NOW() + interval '1 day', NOW() + interval '1 day 3 hours', 'bronze', 'upcoming'),
    (auction4_id, 'Subasta de Antigüedades y Reliquias Históricas', NOW() + interval '3 days', NOW() + interval '3 days 4 hours', 'silver', 'upcoming'),
    (auction5_id, 'Subasta Especial de Coleccionismo y Música', NOW() + interval '5 days', NOW() + interval '5 days 2 hours', 'bronze', 'upcoming');

    -- Artículos
    INSERT INTO public.items (id, auction_id, owner_id, title, description, history, starting_price, status, images)
    VALUES 
    (item_reloj, auction1_id, platino_id, 'Reloj Rolex Vintage 1965', 'Reloj de pulsera Oyster Perpetual en oro amarillo y acero.', 'Colección privada europea.', 10000, 'in_auction', ARRAY['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800']),
    (item_mustang, auction2_id, platino_id, 'Ford Mustang 1969 Fastback', 'Clásico americano V8 302 restaurado a nuevo.', 'Ganador de certámenes de elegancia.', 50000, 'in_auction', ARRAY['https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=800']),
    (item_cuadro, auction2_id, comun_id, 'Cuadro Abstracto Moderno - Óleo', 'Lienzo de gran formato sobre tela con texturas.', 'Galería de arte contemporáneo.', 5000, 'in_auction', ARRAY['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800']),
    (item_joya, auction3_id, admin_id, 'Gargantilla de Diamantes y Oro Blanco', '42 diamantes corte brillante montados en oro blanco 18k.', 'Certificado GIA.', 25000, 'in_auction', ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800']),
    (item_jarron, auction4_id, comun_id, 'Jarrón Porcelana Dinastía Ming', 'Pieza original de porcelana blanca y azul cobalto, siglo XV.', 'Autenticado por expertos.', 18000, 'in_auction', ARRAY['https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800']),
    (item_guitarra, auction5_id, platino_id, 'Guitarra Fender Stratocaster 1974', 'Instrumento original Sunburst.', 'Utilizada en estudios profesionales en los 70s.', 8500, 'in_auction', ARRAY['https://images.unsplash.com/photo-1550291652-6ea9114a47b1?w=800']);

    -- Solo inscribir al Usuario Oro a las 2 subastas activas
    INSERT INTO public.auction_participants (user_id, auction_id)
    VALUES 
    (oro_id, auction1_id),
    (oro_id, auction2_id),
    (comun_id, auction1_id),
    (platino_id, auction2_id);

    -- Medios de pago
    INSERT INTO public.payment_methods (user_id, provider, type, card_number)
    VALUES 
    (oro_id, 'Visa Débito Santander', 'CARD', '**** **** **** 4242'),
    (platino_id, 'Mastercard Black', 'CARD', '**** **** **** 8888'),
    (comun_id, 'Banco Nación', 'BANK', 'CBU 0110001234567890123456');

END $$;
