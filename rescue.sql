-- ==========================================
-- SCRIPT DE RESCATE (REPARA EL ERROR 500)
-- ==========================================
-- 1. Forzamos el borrado de los items de los usuarios corruptos
DELETE FROM public.items 
WHERE owner_id IN (
    SELECT id FROM public.profiles 
    WHERE email IN ('admin@subastasya.com', 'testcomun@test.com', 'testoro@test.com', 'testplatino@test.com')
);

-- 2. Borramos los usuarios corruptos de auth.users (Esto arregla el error 500)
DELETE FROM auth.users 
WHERE email IN ('admin@subastasya.com', 'testcomun@test.com', 'testoro@test.com', 'testplatino@test.com');
