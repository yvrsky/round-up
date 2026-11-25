-- Development seed data: a few Kyiv venues. Applied by `supabase db reset` (local only).
insert into public.gyms (name, address, location, drop_in_fee_cents, currency, is_partner) values
  ('Tiger Muay Thai Kyiv', 'vul. Khreshchatyk 22, Kyiv', extensions.st_setsrid(extensions.st_makepoint(30.5220, 50.4475), 4326)::extensions.geography, 30000, 'UAH', true),
  ('Podil BJJ Academy', 'vul. Sahaidachnoho 10, Kyiv', extensions.st_setsrid(extensions.st_makepoint(30.5196, 50.4636), 4326)::extensions.geography, 25000, 'UAH', false),
  ('Olimpiyskiy Boxing Club', 'vul. Velyka Vasylkivska 55, Kyiv', extensions.st_setsrid(extensions.st_makepoint(30.5212, 50.4339), 4326)::extensions.geography, 20000, 'UAH', false),
  ('Olympic Stadium Track', 'vul. Velyka Vasylkivska 55, Kyiv', extensions.st_setsrid(extensions.st_makepoint(30.5219, 50.4334), 4326)::extensions.geography, null, 'UAH', false);
