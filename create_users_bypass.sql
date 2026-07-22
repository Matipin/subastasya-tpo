-- Habilitar pgcrypto para poder usar crypt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update constraint to allow 'platinum' if it doesn't already
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_category_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_category_check CHECK (category IN ('bronze', 'silver', 'gold', 'platinum'));

-- Delete previous failed attempts
DELETE FROM auth.users WHERE email IN ('testcomun@test.com', 'testoro@test.com', 'testplatino@test.com');

DO $$ 
DECLARE 
    uid1 uuid := gen_random_uuid();
    uid2 uuid := gen_random_uuid();
    uid3 uuid := gen_random_uuid();
BEGIN
    -- testcomun@test.com (Password: comun123)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
        is_super_admin, is_sso_user
    ) VALUES (
        uid1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        'testcomun@test.com', crypt('comun123', gen_salt('bf')), now(), 
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), 
        false, false
    );
        
    INSERT INTO public.profiles (id, email, first_name, last_name, category, is_approved, guarantee_balance)
    VALUES (uid1, 'testcomun@test.com', 'Usuario', 'Comun', 'bronze', true, 100000);
        
    INSERT INTO public.payment_methods (user_id, provider, card_number, type)
    VALUES (uid1, 'Visa Black', '**** **** **** 9999', 'CARD');

    -- testoro@test.com (Password: oro12345)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
        is_super_admin, is_sso_user
    ) VALUES (
        uid2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        'testoro@test.com', crypt('oro12345', gen_salt('bf')), now(), 
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), 
        false, false
    );
        
    INSERT INTO public.profiles (id, email, first_name, last_name, category, is_approved, guarantee_balance)
    VALUES (uid2, 'testoro@test.com', 'Usuario', 'Oro', 'gold', true, 100000);
        
    INSERT INTO public.payment_methods (user_id, provider, card_number, type)
    VALUES (uid2, 'Visa Black', '**** **** **** 9999', 'CARD');

    -- testplatino@test.com (Password: platino123)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
        is_super_admin, is_sso_user
    ) VALUES (
        uid3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        'testplatino@test.com', crypt('platino123', gen_salt('bf')), now(), 
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), 
        false, false
    );
        
    INSERT INTO public.profiles (id, email, first_name, last_name, category, is_approved, guarantee_balance)
    VALUES (uid3, 'testplatino@test.com', 'Usuario', 'Platino', 'platinum', true, 100000);
        
    INSERT INTO public.payment_methods (user_id, provider, card_number, type)
    VALUES (uid3, 'Visa Black', '**** **** **** 9999', 'CARD');
END $$;
