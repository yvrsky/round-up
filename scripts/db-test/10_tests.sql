\set ON_ERROR_STOP 1
create schema t;
grant usage on schema t to authenticated, anon;
create function t.ok(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FAIL: %', msg; end if;
  raise notice 'PASS: %', msg;
end $$;
-- Expect a statement to fail with a given SQLSTATE (prefix match).
create function t.fails(stmt text, state text, msg text) returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'FAIL (no error): %', msg;
exception when others then
  if sqlstate like state || '%' then raise notice 'PASS: % [%]', msg, sqlstate;
  else raise exception 'FAIL: % — got % %', msg, sqlstate, sqlerrm; end if;
end $$;
grant execute on all functions in schema t to authenticated, anon;

-- Fixtures (as superuser)
insert into auth.users values
  ('aaaaaaaa-0000-0000-0000-000000000000','a@x.io'),
  ('bbbbbbbb-0000-0000-0000-000000000000','b@x.io'),
  ('cccccccc-0000-0000-0000-000000000000','c@x.io'),
  ('dddddddd-0000-0000-0000-000000000000','d@x.io');
select t.ok((select count(*) from public.users) = 4, 'signup trigger creates profile rows');
update public.users set weight_kg = 70 where id::text like 'a%';
update public.users set weight_kg = 72 where id::text like 'b%';
update public.users set weight_kg = 90 where id::text like 'c%';
update public.users set weight_kg = 71 where id::text like 'd%';
insert into public.gyms (id, name, address, location) values
  ('99999999-0000-0000-0000-000000000000','Tiger Gym','Kyiv, Khreshchatyk 1',
   extensions.st_setsrid(extensions.st_makepoint(30.5234, 50.4501),4326)::extensions.geography),
  ('88888888-0000-0000-0000-000000000000','Far Gym','Lviv',
   extensions.st_setsrid(extensions.st_makepoint(24.0316, 49.8397),4326)::extensions.geography);

-- ===== anon =====
set role anon;
select t.fails('select * from public.gyms', '42501', 'anon cannot read gyms');
select t.fails('select * from public.get_nearby_sessions(50.45, 30.52)', '42501', 'anon cannot call RPC');
reset role;

-- ===== A: profile privacy =====
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000000';
select t.fails('select base_location from public.users', '42501', 'base_location is not selectable');
select t.fails('select email from public.users', '42501', 'email is not selectable');
select t.fails('select * from public.users', '42501', 'select * on users is denied (column grants)');
select t.ok((select count(*) from public.users where weight_kg is not null) = 4, 'public profile columns readable');
update public.users set full_name = 'Alex', stance = 'orthodox', height_cm = 178 where id = auth.uid();
update public.users set full_name = 'Hacked' where id::text like 'b%';
select t.fails($$update public.users set control_rating = 1 where id = auth.uid()$$, '42501', 'cannot set own control_rating');
select t.fails($$update public.users set is_verified = true where id = auth.uid()$$, '42501', 'cannot self-verify');
insert into public.user_disciplines (discipline_slug, experience_months, rank_label, equipment)
  values ('muay_thai', 24, 'Intermediate', '["16oz_gloves","mouthguard"]');
select t.fails($$insert into public.user_disciplines (discipline_slug, equipment) values ('boxing','{"a":1}')$$, '23514', 'equipment must be a JSON array');
-- Same statement shape PostgREST generates for .upsert(..., { onConflict: 'user_id,discipline_slug' })
insert into public.user_disciplines (discipline_slug, experience_months, rank_label, equipment)
  values ('muay_thai', 36, 'Advanced', '["16oz_gloves"]')
  on conflict (user_id, discipline_slug) do update set
    discipline_slug = excluded.discipline_slug, experience_months = excluded.experience_months,
    rank_label = excluded.rank_label, equipment = excluded.equipment;
select t.ok((select experience_months = 36 and rank_label = 'Advanced' from public.user_disciplines where user_id = auth.uid() and discipline_slug = 'muay_thai'), 'discipline upsert updates in place');
reset role;
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000000';
select t.ok((select count(*) from public.user_disciplines) = 1, 'other users disciplines are readable');
update public.user_disciplines set rank_label = 'hacked' where user_id::text like 'a%';
select t.ok((select rank_label from public.user_disciplines where user_id::text like 'a%') = 'Advanced', 'cannot edit another users discipline');
reset role;
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000000';

-- ===== A: create sessions =====
select t.ok(public.create_training_session('muay_thai','moderate', now() + interval '2 days',
  gym_id => '99999999-0000-0000-0000-000000000000', rounds_format => '5x3 min',
  min_partner_weight => 65, max_partner_weight => 75) is not null, 'create gym session via RPC');
select t.ok(public.create_training_session('running','technical_light', now() + interval '1 day',
  latitude => 50.4547, longitude => 30.5238) is not null, 'create custom-pin session via RPC');
select t.fails($$select public.create_training_session('boxing','moderate', now() + interval '1 day')$$, '22023', 'venue is required');
select t.fails($$select public.create_training_session('boxing','moderate', now() - interval '1 day', gym_id => '99999999-0000-0000-0000-000000000000')$$, '42501', 'cannot create past session');
select t.fails($$insert into public.training_sessions (gym_id, discipline_slug, intensity, scheduled_at, status) values ('99999999-0000-0000-0000-000000000000','boxing','moderate', now()+interval '1 day','matched')$$, '42501', 'cannot insert with status');
select t.fails($$update public.training_sessions set status = 'cancelled'$$, '42501', 'no direct session updates');
select t.ok((select count(*) from public.get_nearby_sessions(50.45, 30.52, 5000)) = 0, 'own sessions excluded from feed');
reset role;
create temp table ids as select
  (select id from public.training_sessions where discipline_slug='muay_thai') as gym_s,
  (select id from public.training_sessions where discipline_slug='running') as pin_s;
grant select on ids to authenticated;

-- ===== B: discovery =====
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000000';
select t.ok((select count(*) from public.get_nearby_sessions(50.45, 30.52, 5000)) = 2, 'B sees both nearby sessions');
select t.ok((select count(*) from public.get_nearby_sessions(50.45, 30.52, 5000, 'muay_thai')) = 1, 'discipline filter');
select t.ok((select count(*) from public.get_nearby_sessions(50.45, 30.52, 5000, user_weight => 90)) = 1, 'weight filter drops out-of-range session');
select t.ok((select count(*) from public.get_nearby_sessions(50.45, 30.52, 5000, intensity_filter => 'hard_sparring')) = 0, 'intensity filter');
select t.ok((select count(*) from public.get_nearby_sessions(50.45, 30.52, 100)) = 0, 'radius filter');
-- A weighs 70: B (72) is within ±3, C-sized athlete (90) is not
select t.ok((select count(*) from public.get_nearby_sessions(50.45, 30.52, 5000, user_weight => 72, weight_tolerance_kg => 3)) = 2, 'weight tolerance keeps similar-size creator');
select t.ok((select count(*) from public.get_nearby_sessions(50.45, 30.52, 5000, weight_tolerance_kg => 10, user_weight => 76)) = 1, 'weight tolerance + eligibility combine (76kg: outside 65-75 bounds, inside ±10)');
select t.ok((select count(*) from public.get_nearby_sessions(50.45, 30.52, 5000, user_weight => 60, weight_tolerance_kg => 3)) = 0, 'weight tolerance drops different-size creator');
select t.ok((select bool_and(creator_weight_kg = 70) from public.get_nearby_sessions(50.45, 30.52, 5000)), 'creator weight returned');
select t.ok((select bool_and(distance_meters is not null and latitude between 50 and 51) from public.get_nearby_sessions(50.45, 30.52, 5000)), 'distance + coords returned');
select t.ok((select array_agg(discipline_slug::text order by distance_meters) from public.get_nearby_sessions(50.4501, 30.5234, 5000)) = '{muay_thai,running}', 'sorted by distance');
select t.ok((select bool_or(name = 'Tiger Gym') and not bool_or(name = 'Far Gym') from public.get_nearby_gyms(50.45, 30.52)), 'nearby gyms includes near, excludes far');
select t.ok((select creator_name from public.session_details where id = (select gym_s from ids)) = 'Alex', 'session_details exposes creator name');
select t.ok((select full_name from public.users where id::text like 'b%') is null, 'A could not edit B profile');
-- B requests
insert into public.session_requests (session_id, message) select gym_s, 'Down to spar' from ids;
select t.fails($$insert into public.session_requests (session_id) select gym_s from ids$$, '23505', 'duplicate request rejected');
reset role;

-- ===== C (90kg) out of range =====
set role authenticated; set request.jwt.claim.sub = 'cccccccc-0000-0000-0000-000000000000';
select t.fails($$insert into public.session_requests (session_id) select gym_s from ids$$, '42501', 'out-of-weight-range request rejected');
insert into public.session_requests (session_id) select pin_s from ids; -- no bounds: OK
reset role;

-- ===== A cannot request own =====
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000000';
select t.fails($$insert into public.session_requests (session_id) select gym_s from ids$$, '42501', 'cannot request own session');
reset role;

-- ===== D requests, then visibility =====
set role authenticated; set request.jwt.claim.sub = 'dddddddd-0000-0000-0000-000000000000';
insert into public.session_requests (session_id) select gym_s from ids;
select t.ok((select count(*) from public.session_requests) = 1, 'D sees only own request');
select t.fails($$update public.session_requests set status = 'accepted'$$, '42501', 'applicant cannot self-accept');
reset role;
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000000';
select t.ok((select count(*) from public.session_requests where session_id = (select gym_s from ids)) = 2, 'creator sees all requests for session');
reset role;

-- ===== B tries to accept; A accepts B =====
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000000';
select t.fails($$select public.accept_session_request((select id from public.session_requests limit 1))$$, '42501', 'non-creator cannot accept');
reset role;
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000000';
select public.accept_session_request((select id from public.session_requests where applicant_id::text like 'b%'));
select t.ok((select status = 'matched' and matched_partner_id::text like 'b%' from public.training_sessions where id = (select gym_s from ids)), 'session matched to B');
select t.ok((select status from public.session_requests where applicant_id::text like 'd%') = 'declined', 'other requests declined');
select t.fails($$select public.accept_session_request((select id from public.session_requests where applicant_id::text like 'd%'))$$, '22023', 'cannot accept on matched session');
insert into public.session_messages (session_id, content, is_preset) select gym_s, 'Bringing 16oz gloves', true from ids;
reset role;

-- ===== chat access =====
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000000';
select t.ok((select count(*) from public.session_messages) = 1, 'matched partner reads chat');
insert into public.session_messages (session_id, content) select gym_s, 'See you there' from ids;
select t.fails($$insert into public.session_messages (session_id, content, sender_id) select gym_s, 'spoof', 'aaaaaaaa-0000-0000-0000-000000000000' from ids$$, '42501', 'cannot spoof sender');
select t.fails($$insert into public.session_messages (session_id, content) select gym_s, '' from ids$$, '23514', 'empty message rejected');
reset role;
set role authenticated; set request.jwt.claim.sub = 'dddddddd-0000-0000-0000-000000000000';
select t.ok((select count(*) from public.session_messages) = 0, 'declined applicant cannot read chat');
select t.fails($$insert into public.session_messages (session_id, content) select gym_s, 'hi' from ids$$, '42501', 'declined applicant cannot post');
select t.ok((select count(*) from public.training_sessions where id = (select gym_s from ids)) = 1, 'declined applicant still sees the session');
reset role;
set role authenticated; set request.jwt.claim.sub = 'cccccccc-0000-0000-0000-000000000000';
select t.ok((select count(*) from public.training_sessions where id = (select gym_s from ids)) = 0, 'unrelated user cannot see matched session');
select t.ok((select count(*) from public.session_messages where session_id = (select pin_s from ids)) = 0, 'pending applicant chat starts empty');
insert into public.session_messages (session_id, content) select pin_s, 'Pace?' from ids;
reset role;

-- ===== reviews =====
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000000';
select t.fails($$insert into public.session_reviews (session_id, reviewee_id, control_score, punctuality_score) select gym_s, 'bbbbbbbb-0000-0000-0000-000000000000', 4, 5 from ids$$, '42501', 'cannot review before session time');
reset role;
update public.training_sessions set scheduled_at = now() - interval '1 hour' where id = (select gym_s from ids);
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000000';
select t.fails($$insert into public.session_reviews (session_id, reviewee_id, control_score, punctuality_score) select gym_s, 'dddddddd-0000-0000-0000-000000000000', 1, 1 from ids$$, '42501', 'cannot review non-partner');
select t.fails($$insert into public.session_reviews (session_id, reviewee_id, control_score, punctuality_score) select gym_s, 'bbbbbbbb-0000-0000-0000-000000000000', 6, 5 from ids$$, '23514', 'score must be 1-5');
insert into public.session_reviews (session_id, reviewee_id, control_score, punctuality_score, comment)
  select gym_s, 'bbbbbbbb-0000-0000-0000-000000000000', 4, 5, 'Great control' from ids;
select t.ok((select control_rating = 4.50 and completed_sessions_count = 1 from public.users where id::text like 'b%'), 'trigger recalculates rating (4.50) and count');
select t.ok((select status from public.training_sessions where id = (select gym_s from ids)) = 'matched', 'session not completed after one review');
select t.fails($$insert into public.session_reviews (session_id, reviewee_id, control_score, punctuality_score) select gym_s, 'bbbbbbbb-0000-0000-0000-000000000000', 1, 1 from ids$$, '23505', 'cannot review twice');
reset role;
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000000';
insert into public.session_reviews (session_id, reviewee_id, control_score, punctuality_score)
  select gym_s, 'aaaaaaaa-0000-0000-0000-000000000000', 3, 3 from ids;
select t.ok((select control_rating from public.users where id::text like 'a%') = 3.00, 'A rating 3.00');
select t.ok((select status from public.training_sessions where id = (select gym_s from ids)) = 'completed', 'session completed after both reviews');
reset role;

-- ===== withdraw & cancel =====
set role authenticated; set request.jwt.claim.sub = 'cccccccc-0000-0000-0000-000000000000';
update public.session_requests set status = 'withdrawn' where applicant_id = auth.uid();
select t.ok((select status from public.session_requests where applicant_id = auth.uid()) = 'withdrawn', 'applicant withdraws');
select t.ok((select count(*) from public.session_messages where session_id = (select pin_s from ids)) = 0, 'withdrawn applicant loses chat access');
reset role;
set role authenticated; set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000000';
select t.fails($$select public.cancel_training_session((select pin_s from ids))$$, '42501', 'non-creator cannot cancel');
reset role;
set role authenticated; set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000000';
select public.cancel_training_session((select pin_s from ids));
select t.ok((select status from public.training_sessions where id = (select pin_s from ids)) = 'cancelled', 'creator cancels');
reset role;
set role authenticated; set request.jwt.claim.sub = 'dddddddd-0000-0000-0000-000000000000';
select t.ok((select count(*) from public.get_nearby_sessions(50.45, 30.52, 5000)) = 0, 'cancelled/completed sessions leave the feed');
reset role;
select t.ok(exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='session_messages'), 'session_messages in realtime publication');
\echo ALL_TESTS_PASSED
