-- Habilitar pgcrypto para poder usar crypt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ 
DECLARE 
    uid1 uuid := gen_random_uuid();
    uid2 uuid := gen_random_uuid();
    uid3 uuid := gen_random_uuid();
BEGIN
    -- testcomun@test.com (Password: comun123)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'testcomun@test.com') THEN
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (uid1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'testcomun@test.com', crypt('comun123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
        
        INSERT INTO public.profiles (id, first_name, last_name, category, is_approved, guarantee_balance)
        VALUES (uid1, 'Usuario', 'Comun', 'bronze', true, 100000);
        
        INSERT INTO public.payment_methods (user_id, provider, card_number, type)
        VALUES (uid1, 'Visa Black', '**** **** **** 9999', 'CARD');
    END IF;

    -- testoro@test.com (Password: oro12345)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'testoro@test.com') THEN
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (uid2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'testoro@test.com', crypt('oro12345', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
        
        INSERT INTO public.profiles (id, first_name, last_name, category, is_approved, guarantee_balance)
        VALUES (uid2, 'Usuario', 'Oro', 'gold', true, 100000);
        
        INSERT INTO public.payment_methods (user_id, provider, card_number, type)
        VALUES (uid2, 'Visa Black', '**** **** **** 9999', 'CARD');
    END IF;

    -- testplatino@test.com (Password: platino123)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'testplatino@test.com') THEN
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (uid3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'testplatino@test.com', crypt('platino123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
        
        INSERT INTO public.profiles (id, first_name, last_name, category, is_approved, guarantee_balance)
        VALUES (uid3, 'Usuario', 'Platino', 'platinum', true, 100000);
        
        INSERT INTO public.payment_methods (user_id, provider, card_number, type)
        VALUES (uid3, 'Visa Black', '**** **** **** 9999', 'CARD');
    END IF;
END $$;
