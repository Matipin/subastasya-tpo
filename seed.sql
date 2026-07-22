-- ==========================================
-- SEED DATA PARA SUBASTAS YA
-- ==========================================

-- 1. CREACIÓN DE SUBASTAS (4 Subastas de Prueba)
INSERT INTO public.auctions (id, title, description, start_date, end_date, currency, status, minimum_category)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Subasta de Arte Contemporáneo', 'Obras exclusivas.', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '5 days', 'USD', 'active', 'bronze'),
('22222222-2222-2222-2222-222222222222', 'Relojería Fina y Joyas', 'Relojes suizos.', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '10 days', 'USD', 'upcoming', 'gold'),
('33333333-3333-3333-3333-333333333333', 'Antigüedades Europeas', 'Muebles.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', 'USD', 'ended', 'silver'),
('44444444-4444-4444-4444-444444444444', 'Coches Clásicos de Colección', 'Vehículos históricos.', NOW() + INTERVAL '24 hours', NOW() + INTERVAL '30 days', 'USD', 'upcoming', 'platinum')
ON CONFLICT (id) DO NOTHING;

-- 2. CREACIÓN DE ARTÍCULOS (Items)
-- Nota: En Postgres el array de texto se escribe como ARRAY['url1', 'url2']
INSERT INTO public.items (id, auction_id, title, description, history, starting_price, images, status)
VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Cuadro Abstracto "Noche Estelar"', 'Óleo sobre lienzo, 120x80cm.', 'Adquirido en galería de París en 2015.', 1500.00, ARRAY['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500'], 'in_auction'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Escultura de Bronce Modernista', 'Escultura firmada por el autor original.', 'Colección privada.', 3200.00, ARRAY['https://images.unsplash.com/photo-1569617084133-26942bb441f2?w=500'], 'in_auction'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Rolex Submariner Vintage', 'Reloj Rolex Submariner de 1980 en excelente estado.', 'Único dueño, con caja y papeles.', 12500.00, ARRAY['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500'], 'approved'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'Ford Mustang 1967 Fastback', 'Restauración completa, motor V8.', 'Importado desde Detroit, un verdadero clásico americano.', 45000.00, ARRAY['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500'], 'in_auction')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- ACTUALIZACIÓN DE USUARIOS DE PRUEBA
-- ==========================================
-- Instrucciones para el usuario:
-- 1. Regístrate en la app con los correos testcomun@test.com, testoro@test.com y testplatino@test.com.
-- 2. Una vez registrados, vuelve aquí y ejecuta las siguientes 3 líneas seleccionándolas y dándole a "Run".

UPDATE public.profiles SET category = 'bronze', status = 'active', is_approved = true, guarantee_balance = 100000.00 WHERE email = 'testcomun@test.com';
UPDATE public.profiles SET category = 'gold', status = 'active', is_approved = true, guarantee_balance = 100000.00 WHERE email = 'testoro@test.com';
UPDATE public.profiles SET category = 'platinum', status = 'active', is_approved = true, guarantee_balance = 100000.00 WHERE email = 'testplatino@test.com';

-- Crearles una tarjeta validada automáticamente
INSERT INTO public.payment_methods (user_id, provider, card_number, type)
SELECT id, 'Visa Black', '**** **** **** 9999', 'CARD' FROM auth.users WHERE email IN ('testcomun@test.com', 'testoro@test.com', 'testplatino@test.com')
ON CONFLICT DO NOTHING;
