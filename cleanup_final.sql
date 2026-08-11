DELETE FROM public.items;
DELETE FROM public.auctions;
DELETE FROM auth.users WHERE email IN ('admin@subastasya.com', 'testcomun@test.com', 'testoro@test.com', 'testplatino@test.com');
