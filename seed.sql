-- ==========================================
-- SCRIPT DE SEMILLA PARA PRUEBAS
-- ==========================================
-- Instrucciones: Pega este código completo en el SQL Editor de Supabase y ejecútalo (Run).

-- 1. Habilitamos la extensión pgcrypto para poder encriptar las contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Aseguramos que la restricción de categorías permita 'platinum'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_category_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_category_check CHECK (category IN ('bronze', 'silver', 'gold', 'platinum'));

-- 3. Actualizamos la tabla auctions
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS minimum_category TEXT DEFAULT 'bronze';

-- 4. Creamos la tabla de participantes de subasta si no existe
CREATE TABLE IF NOT EXISTS public.auction_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    auction_id UUID REFERENCES public.auctions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, auction_id)
);

-- 5. Creamos la tabla de transacciones si no existe
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ 
DECLARE 
    admin_id uuid := gen_random_uuid();
    comun_id uuid := gen_random_uuid();
    oro_id uuid := gen_random_uuid();
    platino_id uuid := gen_random_uuid();
    auction_id uuid := gen_random_uuid();
    item1_id uuid := gen_random_uuid();
    item2_id uuid := gen_random_uuid();
    item3_id uuid := gen_random_uuid();
    
    auction_start TIMESTAMPTZ := NOW() + interval '1 day'; -- Empieza mañana
    auction_end TIMESTAMPTZ := NOW() + interval '1 day' + interval '2 hours';
BEGIN
    -- ==========================================
    -- LIMPIEZA PREVIA (Para evitar duplicados)
    -- ==========================================
    DELETE FROM auth.users WHERE email IN ('admin@subastasya.com', 'testcomun@test.com', 'testoro@test.com', 'testplatino@test.com');
    -- La eliminación en cascada borrará perfiles, subastas, items y pujas relacionadas.

    -- ==========================================
    -- CREACIÓN DE USUARIOS AUTH (Contraseña: 123456)
    -- ==========================================
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES 
    (admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@subastasya.com', crypt('123456', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', NOW(), NOW()),
    (comun_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'testcomun@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', NOW(), NOW()),
    (oro_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'testoro@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', NOW(), NOW()),
    (platino_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'testplatino@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', NOW(), NOW());

    -- ==========================================
    -- CREACIÓN DE PERFILES
    -- ==========================================
    INSERT INTO public.profiles (id, email, first_name, last_name, category, is_approved, guarantee_balance)
    VALUES 
    (admin_id, 'admin@subastasya.com', 'SubastasYa', 'Tesorería', 'platinum', true, 1000000000), -- 1 Billón
    (comun_id, 'testcomun@test.com', 'Usuario', 'Comun', 'bronze', true, 100000),
    (oro_id, 'testoro@test.com', 'Usuario', 'Oro', 'gold', true, 500000),
    (platino_id, 'testplatino@test.com', 'Usuario', 'Platino', 'platinum', true, 1500000);

    -- ==========================================
    -- CREACIÓN DE SUBASTA
    -- ==========================================
    INSERT INTO public.auctions (id, title, start_date, end_date, minimum_category, status)
    VALUES (auction_id, 'Gran Subasta de Verano (Prueba)', auction_start, auction_end, 'bronze', 'active');

    -- ==========================================
    -- CREACIÓN DE ARTÍCULOS
    -- ==========================================
    -- Item 1: Reloj (Dueño: Usuario Oro) - Base 10,000
    INSERT INTO public.items (id, auction_id, owner_id, title, description, starting_price, status, images)
    VALUES (item1_id, auction_id, oro_id, 'Reloj Rolex Vintage', 'Reloj de colección en excelente estado.', 10000, 'in_auction', ARRAY['https://images.unsplash.com/photo-1523170335258-f5ed11844a49']);

    -- Item 2: Auto (Dueño: Usuario Platino) - Base 50,000
    INSERT INTO public.items (id, auction_id, owner_id, title, description, starting_price, status, images)
    VALUES (item2_id, auction_id, platino_id, 'Ford Mustang 1969', 'Clásico americano restaurado a nuevo.', 50000, 'in_auction', ARRAY['https://images.unsplash.com/photo-1584345611124-277def598e3b']);

    -- Item 3: Arte (Dueño: Usuario Comun) - Base 5,000
    INSERT INTO public.items (id, auction_id, owner_id, title, description, starting_price, status, images)
    VALUES (item3_id, auction_id, comun_id, 'Cuadro Abstracto Moderno', 'Obra de artista contemporáneo.', 5000, 'in_auction', ARRAY['https://images.unsplash.com/photo-1579783902614-a3f14002a9e5']);

    -- ==========================================
    -- INSCRIPCIÓN AUTOMÁTICA A LA SUBASTA
    -- ==========================================
    -- Inscribimos a los 3 usuarios de prueba a la subasta para no tener que hacerlo a mano
    INSERT INTO public.auction_participants (user_id, auction_id)
    VALUES 
    (comun_id, auction_id),
    (oro_id, auction_id),
    (platino_id, auction_id);

END $$;
