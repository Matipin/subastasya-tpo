-- =========================================================================
-- SCRIPT FINAL DE POBLACIÓN Y CORRECCIÓN (SubastasYa)
-- =========================================================================
-- Instrucciones: Pega este código completo en el SQL Editor de Supabase y ejecútalo (Run).

-- 1. ARREGLO DE PERMISOS: Conceder permisos sobre todas las tablas públicas
GRANT ALL ON TABLE public.profiles TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.auctions TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.items TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.auction_participants TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.bids TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.debts TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.payment_methods TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.item_proposals TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.transactions TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.notifications TO postgres, service_role, authenticated, anon;

-- 2. POLÍTICAS RLS PARA PUJAS E ITEMS (Permitir lectura y pujas en vivo sin error de permisos)
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bids are viewable by everyone." ON public.bids;
CREATE POLICY "Bids are viewable by everyone." ON public.bids FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can place bids." ON public.bids;
CREATE POLICY "Users can place bids." ON public.bids FOR INSERT WITH CHECK (true);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Items are viewable by everyone." ON public.items;
CREATE POLICY "Items are viewable by everyone." ON public.items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update items." ON public.items;
CREATE POLICY "Users can update items." ON public.items FOR UPDATE USING (true);

DO $$ 
DECLARE 
    -- Obtener IDs de usuarios existentes
    admin_id uuid := (SELECT id FROM auth.users WHERE email = 'admin@subastasya.com');
    comun_id uuid := (SELECT id FROM auth.users WHERE email = 'testcomun@test.com');
    oro_id uuid := (SELECT id FROM auth.users WHERE email = 'testoro@test.com');
    platino_id uuid := (SELECT id FROM auth.users WHERE email = 'testplatino@test.com');
    
    -- Subastas: 2 activas hoy + 3 futuras para inscribirse
    auction1_id uuid := gen_random_uuid();
    auction2_id uuid := gen_random_uuid();
    auction3_id uuid := gen_random_uuid();
    auction4_id uuid := gen_random_uuid();
    auction5_id uuid := gen_random_uuid();

    -- Artículos
    item_reloj uuid := gen_random_uuid();
    item_mustang uuid := gen_random_uuid();
    item_cuadro uuid := gen_random_uuid();
    item_joya uuid := gen_random_uuid();
    item_jarron uuid := gen_random_uuid();
    item_guitarra uuid := gen_random_uuid();
BEGIN

    -- 3. LIMPIEZA COMPLETA DE OBJETOS Y SUBASTAS DUPLICADAS / ANTIGUAS
    DELETE FROM public.bids;
    DELETE FROM public.auction_participants;
    DELETE FROM public.items;
    DELETE FROM public.auctions;

    -- 4. ACTUALIZACIÓN / VERIFICACIÓN DE PERFILES
    INSERT INTO public.profiles (id, email, first_name, last_name, category, is_approved, guarantee_balance)
    VALUES 
    (admin_id, 'admin@subastasya.com', 'SubastasYa', 'Tesorería', 'platinum', true, 1000000000),
    (comun_id, 'testcomun@test.com', 'Usuario', 'Comun', 'bronze', true, 100000),
    (oro_id, 'testoro@test.com', 'Usuario', 'Oro', 'gold', true, 500000),
    (platino_id, 'testplatino@test.com', 'Usuario', 'Platino', 'platinum', true, 1500000)
    ON CONFLICT (id) DO UPDATE SET 
        first_name = EXCLUDED.first_name, 
        last_name = EXCLUDED.last_name, 
        category = EXCLUDED.category, 
        is_approved = EXCLUDED.is_approved, 
        guarantee_balance = EXCLUDED.guarantee_balance;

    -- 5. CREACIÓN DE SUBASTAS VARIADAS Y EN FECHA
    -- Subasta 1: EN VIVO AHORA (Inició hace 30m, termina en 2h)
    INSERT INTO public.auctions (id, title, start_date, end_date, minimum_category, status)
    VALUES (auction1_id, 'Subasta Exclusiva de Lujo en Vivo', NOW() - interval '30 minutes', NOW() + interval '2 hours', 'bronze', 'active');

    -- Subasta 2: EN VIVO AHORA (Inició hace 15m, termina en 3h)
    INSERT INTO public.auctions (id, title, start_date, end_date, minimum_category, status)
    VALUES (auction2_id, 'Gran Subasta de Autos Clásicos y Arte', NOW() - interval '15 minutes', NOW() + interval '3 hours', 'bronze', 'active');

    -- Subasta 3: PRÓXIMA (Mañana a las 18hs - Disponible para inscripción)
    INSERT INTO public.auctions (id, title, start_date, end_date, minimum_category, status)
    VALUES (auction3_id, 'Subasta de Alta Joyería y Gemas Preciosas', NOW() + interval '1 day', NOW() + interval '1 day 3 hours', 'bronze', 'upcoming');

    -- Subasta 4: PRÓXIMA (En 3 días - Disponible para inscripción)
    INSERT INTO public.auctions (id, title, start_date, end_date, minimum_category, status)
    VALUES (auction4_id, 'Subasta de Antigüedades y Reliquias Históricas', NOW() + interval '3 days', NOW() + interval '3 days 4 hours', 'silver', 'upcoming');

    -- Subasta 5: PRÓXIMA (En 5 días - Disponible para inscripción)
    INSERT INTO public.auctions (id, title, start_date, end_date, minimum_category, status)
    VALUES (auction5_id, 'Subasta Especial de Coleccionismo y Música', NOW() + interval '5 days', NOW() + interval '5 days 2 hours', 'bronze', 'upcoming');

    -- 6. CREACIÓN DE ARTÍCULOS SIN DUPLICADOS Y CON FOTOS VERIFICADAS
    -- Subasta 1: Reloj Rolex Vintage (Dueño: Platino, para que Oro pueda pujar)
    INSERT INTO public.items (id, auction_id, owner_id, title, description, history, starting_price, status, images)
    VALUES (
        item_reloj, 
        auction1_id, 
        platino_id, 
        'Reloj Rolex Vintage 1965', 
        'Reloj de pulsera Oyster Perpetual en oro amarillo y acero, calibre original revisado.', 
        'Perteneció a la colección privada de una familia diplomática europea.', 
        10000, 
        'in_auction', 
        ARRAY['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800']
    );

    -- Subasta 2: Ford Mustang 1969 Fastback (Foto funcional)
    INSERT INTO public.items (id, auction_id, owner_id, title, description, history, starting_price, status, images)
    VALUES (
        item_mustang, 
        auction2_id, 
        platino_id, 
        'Ford Mustang 1969 Fastback', 
        'Clásico americano icono con motor V8 302 restaurado íntegramente a especificaciones de fábrica.', 
        'Ganador de múltiples certámenes de elegancia y conservado en garaje climatizado.', 
        50000, 
        'in_auction', 
        ARRAY['https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=800']
    );

    -- Subasta 2: Cuadro Abstracto Moderno (Foto funcional)
    INSERT INTO public.items (id, auction_id, owner_id, title, description, history, starting_price, status, images)
    VALUES (
        item_cuadro, 
        auction2_id, 
        comun_id, 
        'Cuadro Abstracto Moderno - Óleo', 
        'Lienzo de gran formato técnica mixta sobre tela con texturas y pigmentos naturales.', 
        'Exhibido en galerías de arte contemporáneo en Buenos Aires.', 
        5000, 
        'in_auction', 
        ARRAY['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800']
    );

    -- Subasta 3: Gargantilla de Diamantes
    INSERT INTO public.items (id, auction_id, owner_id, title, description, history, starting_price, status, images)
    VALUES (
        item_joya, 
        auction3_id, 
        admin_id, 
        'Gargantilla de Diamantes y Oro Blanco', 
        'Joya de alta orfebrería con 42 diamantes corte brillante montados en oro blanco de 18k.', 
        'Certificado gemológico oficial GIA incluido.', 
        25000, 
        'in_auction', 
        ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800']
    );

    -- Subasta 4: Jarrón Dinastía Ming
    INSERT INTO public.items (id, auction_id, owner_id, title, description, history, starting_price, status, images)
    VALUES (
        item_jarron, 
        auction4_id, 
        comun_id, 
        'Jarrón Porcelana Dinastía Ming', 
        'Pieza original de porcelana blanca y azul cobalto, época del emperador Xuande (siglo XV).', 
        'Catalogado y autenticado por tasadores de antigüedades orientales.', 
        18000, 
        'in_auction', 
        ARRAY['https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800']
    );

    -- Subasta 5: Guitarra Eléctrica Vintage
    INSERT INTO public.items (id, auction_id, owner_id, title, description, history, starting_price, status, images)
    VALUES (
        item_guitarra, 
        auction5_id, 
        platino_id, 
        'Guitarra Fender Stratocaster 1974', 
        'Instrumento original en acabado Sunburst con pastillas simples escalonadas.', 
        'Utilizada en grabaciones de estudio profesionales en la década de los 70.', 
        8500, 
        'in_auction', 
        ARRAY['https://images.unsplash.com/photo-1550291652-6ea9114a47b1?w=800']
    );

    -- 7. INSCRIPCIÓN: El Usuario Oro SOLO está inscripto a las 2 subastas activas (en vivo)
    -- Las demás subastas quedan disponibles para que se inscriba manualmente
    INSERT INTO public.auction_participants (user_id, auction_id)
    VALUES 
    (oro_id, auction1_id),
    (oro_id, auction2_id),
    (comun_id, auction1_id),
    (platino_id, auction2_id);

    -- 8. MEDIOS DE PAGO PRECARGADOS (Para evitar trabas al pujar en sala en vivo)
    INSERT INTO public.payment_methods (user_id, provider, type, card_number)
    VALUES 
    (oro_id, 'Visa Débito Santander', 'CARD', '**** **** **** 4242'),
    (platino_id, 'Mastercard Black', 'CARD', '**** **** **** 8888'),
    (comun_id, 'Banco Nación', 'BANK', 'CBU 0110001234567890123456');

END $$;
