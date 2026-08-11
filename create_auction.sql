-- ==========================================
-- CREACIÓN DE SUBASTA Y ARTÍCULOS
-- ==========================================
DO $$ 
DECLARE 
    -- Buscamos los IDs de los usuarios que el bot acaba de crear
    admin_id uuid := (SELECT id FROM auth.users WHERE email = 'admin@subastasya.com');
    comun_id uuid := (SELECT id FROM auth.users WHERE email = 'testcomun@test.com');
    oro_id uuid := (SELECT id FROM auth.users WHERE email = 'testoro@test.com');
    platino_id uuid := (SELECT id FROM auth.users WHERE email = 'testplatino@test.com');
    
    auction_id uuid := gen_random_uuid();
    item1_id uuid := gen_random_uuid();
    item2_id uuid := gen_random_uuid();
    item3_id uuid := gen_random_uuid();
    
    auction_start TIMESTAMPTZ := NOW() - interval '1 day'; -- Empieza ayer (Ya activa)
    auction_end TIMESTAMPTZ := NOW() + interval '2 hours'; -- Termina en 2 horas
BEGIN
    -- CREACIÓN DE SUBASTA
    INSERT INTO public.auctions (id, title, start_date, end_date, minimum_category, status)
    VALUES (auction_id, 'Gran Subasta de Verano (Prueba)', auction_start, auction_end, 'bronze', 'active');

    -- CREACIÓN DE ARTÍCULOS
    INSERT INTO public.items (id, auction_id, owner_id, title, description, starting_price, status, images)
    VALUES (item1_id, auction_id, oro_id, 'Reloj Rolex Vintage', 'Reloj de colección en excelente estado.', 10000, 'in_auction', ARRAY['https://images.unsplash.com/photo-1523170335258-f5ed11844a49']);

    INSERT INTO public.items (id, auction_id, owner_id, title, description, starting_price, status, images)
    VALUES (item2_id, auction_id, platino_id, 'Ford Mustang 1969', 'Clásico americano restaurado a nuevo.', 50000, 'in_auction', ARRAY['https://images.unsplash.com/photo-1584345611124-277def598e3b']);

    INSERT INTO public.items (id, auction_id, owner_id, title, description, starting_price, status, images)
    VALUES (item3_id, auction_id, comun_id, 'Cuadro Abstracto Moderno', 'Obra de artista contemporáneo.', 5000, 'in_auction', ARRAY['https://images.unsplash.com/photo-1579783902614-a3f14002a9e5']);

    -- INSCRIPCIÓN AUTOMÁTICA
    INSERT INTO public.auction_participants (user_id, auction_id)
    VALUES 
    (comun_id, auction_id),
    (oro_id, auction_id),
    (platino_id, auction_id);
END $$;
