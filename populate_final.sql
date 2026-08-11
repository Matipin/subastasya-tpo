-- ==========================================
-- SCRIPT FINAL DE POBLACIÓN (PASO 3)
-- ==========================================
-- Instrucciones: Pega este código completo en el SQL Editor de Supabase y ejecútalo (Run).

-- ARREGLO DE PERMISOS: Aseguramos que tengas acceso a modificar las tablas
GRANT ALL ON TABLE public.profiles TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.auctions TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.items TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.auction_participants TO postgres, service_role, authenticated, anon;

DO $$ 
DECLARE 
    -- Buscamos los IDs de los usuarios nativos y sin errores que el bot acaba de crear
    admin_id uuid := (SELECT id FROM auth.users WHERE email = 'admin@subastasya.com');
    comun_id uuid := (SELECT id FROM auth.users WHERE email = 'testcomun@test.com');
    oro_id uuid := (SELECT id FROM auth.users WHERE email = 'testoro@test.com');
    platino_id uuid := (SELECT id FROM auth.users WHERE email = 'testplatino@test.com');
    
    auction_id uuid := gen_random_uuid();
    item1_id uuid := gen_random_uuid();
    item2_id uuid := gen_random_uuid();
    item3_id uuid := gen_random_uuid();
    
    auction_start TIMESTAMPTZ := NOW() - interval '1 day'; -- Empieza ayer (Ya está activa)
    auction_end TIMESTAMPTZ := NOW() + interval '2 hours'; -- Termina en 2 horas
BEGIN

    -- 1. CREACIÓN O ACTUALIZACIÓN DE PERFILES
    INSERT INTO public.profiles (id, email, first_name, last_name, category, is_approved, guarantee_balance)
    VALUES 
    (admin_id, 'admin@subastasya.com', 'SubastasYa', 'Tesorería', 'platinum', true, 1000000000), -- 1 Billón
    (comun_id, 'testcomun@test.com', 'Usuario', 'Comun', 'bronze', true, 100000),
    (oro_id, 'testoro@test.com', 'Usuario', 'Oro', 'gold', true, 500000),
    (platino_id, 'testplatino@test.com', 'Usuario', 'Platino', 'platinum', true, 1500000)
    ON CONFLICT (id) DO UPDATE SET 
        first_name = EXCLUDED.first_name, 
        last_name = EXCLUDED.last_name, 
        category = EXCLUDED.category, 
        is_approved = EXCLUDED.is_approved, 
        guarantee_balance = EXCLUDED.guarantee_balance;

    -- 2. CREACIÓN DE SUBASTA
    INSERT INTO public.auctions (id, title, start_date, end_date, minimum_category, status)
    VALUES (auction_id, 'Gran Subasta de Verano (Prueba Automática)', auction_start, auction_end, 'bronze', 'active');

    -- 3. CREACIÓN DE ARTÍCULOS
    -- Item 1: Reloj (Dueño: Usuario Oro) - Base 10,000
    INSERT INTO public.items (id, auction_id, owner_id, title, description, starting_price, status, images)
    VALUES (item1_id, auction_id, oro_id, 'Reloj Rolex Vintage', 'Reloj de colección en excelente estado.', 10000, 'in_auction', ARRAY['https://images.unsplash.com/photo-1523170335258-f5ed11844a49']);

    -- Item 2: Auto (Dueño: Usuario Platino) - Base 50,000
    INSERT INTO public.items (id, auction_id, owner_id, title, description, starting_price, status, images)
    VALUES (item2_id, auction_id, platino_id, 'Ford Mustang 1969', 'Clásico americano restaurado a nuevo.', 50000, 'in_auction', ARRAY['https://images.unsplash.com/photo-1584345611124-277def598e3b']);

    -- Item 3: Arte (Dueño: Usuario Comun) - Base 5,000
    INSERT INTO public.items (id, auction_id, owner_id, title, description, starting_price, status, images)
    VALUES (item3_id, auction_id, comun_id, 'Cuadro Abstracto Moderno', 'Obra de artista contemporáneo.', 5000, 'in_auction', ARRAY['https://images.unsplash.com/photo-1579783902614-a3f14002a9e5']);

    -- 4. INSCRIPCIÓN AUTOMÁTICA A LA SUBASTA
    INSERT INTO public.auction_participants (user_id, auction_id)
    VALUES 
    (comun_id, auction_id),
    (oro_id, auction_id),
    (platino_id, auction_id);

END $$;
