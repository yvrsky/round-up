-- RoundUp — initial schema
-- Tables, indexes, RLS, triggers, and RPCs for the MVP.
--
-- Privilege model: Supabase grants ALL on new public tables to anon/authenticated by default.
-- Every table below revokes that and re-grants only the columns the client may read/write, so
-- RLS (rows) and column grants (fields) together decide what the app can touch. State changes
-- that must be atomic or validated across rows (accepting a partner, cancelling) go through
-- SECURITY DEFINER RPCs instead of direct UPDATEs.

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.stance as enum ('orthodox', 'southpaw', 'switch');
create type public.discipline_slug as enum ('muay_thai', 'bjj_gi', 'bjj_nogi', 'boxing', 'running');
create type public.session_intensity as enum ('technical_light', 'moderate', 'hard_sparring', 'drills_only');
create type public.session_status as enum ('open', 'matched', 'completed', 'cancelled');
create type public.request_status as enum ('pending', 'accepted', 'declined', 'withdrawn');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.gyms (
  id                uuid primary key default gen_random_uuid(),
  name              varchar(120) not null,
  address           text not null,
  location          extensions.geography(Point, 4326) not null,
  drop_in_fee_cents int check (drop_in_fee_cents >= 0),
  currency          varchar(3) not null default 'UAH',
  is_partner        boolean not null default false,
  created_at        timestamptz not null default now()
);

create table public.users (
  id                       uuid primary key references auth.users (id) on delete cascade,
  email                    varchar(320),
  full_name                varchar(120),
  avatar_url               text,
  weight_kg                numeric(5, 2) check (weight_kg between 30 and 250),
  height_cm                smallint check (height_cm between 100 and 250),
  stance                   public.stance,
  home_gym_id              uuid references public.gyms (id) on delete set null,
  -- PRIVATE: never granted for SELECT to client roles.
  base_location            extensions.geography(Point, 4326),
  control_rating           numeric(3, 2) not null default 5.00 check (control_rating between 0 and 5),
  completed_sessions_count int not null default 0 check (completed_sessions_count >= 0),
  is_verified              boolean not null default false,
  -- Set when the onboarding flow finishes; the app's auth guard keys off this.
  onboarding_completed_at  timestamptz,
  created_at               timestamptz not null default now()
);

create table public.user_disciplines (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references public.users (id) on delete cascade,
  discipline_slug   public.discipline_slug not null,
  experience_months smallint not null default 0 check (experience_months between 0 and 1200),
  rank_label        varchar(60),
  equipment         jsonb not null default '[]'::jsonb check (jsonb_typeof(equipment) = 'array'),
  created_at        timestamptz not null default now(),
  unique (user_id, discipline_slug)
);

create table public.training_sessions (
  id                 uuid primary key default gen_random_uuid(),
  creator_id         uuid not null default auth.uid() references public.users (id) on delete cascade,
  gym_id             uuid references public.gyms (id) on delete restrict,
  custom_location    extensions.geography(Point, 4326),
  discipline_slug    public.discipline_slug not null,
  intensity          public.session_intensity not null,
  scheduled_at       timestamptz not null,
  rounds_format      varchar(40),
  min_partner_weight numeric(5, 2) check (min_partner_weight > 0),
  max_partner_weight numeric(5, 2) check (max_partner_weight > 0),
  notes              text check (char_length(notes) <= 1000),
  status             public.session_status not null default 'open',
  matched_partner_id uuid references public.users (id) on delete set null,
  created_at         timestamptz not null default now(),
  -- A session happens either at a gym or at a custom pin, never both or neither.
  constraint training_sessions_venue_check check (num_nonnulls(gym_id, custom_location) = 1),
  constraint training_sessions_weight_range_check
    check (min_partner_weight is null or max_partner_weight is null or min_partner_weight <= max_partner_weight),
  constraint training_sessions_partner_check
    check (status not in ('matched', 'completed') or matched_partner_id is not null),
  constraint training_sessions_not_self_check check (matched_partner_id <> creator_id)
);

create table public.session_requests (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.training_sessions (id) on delete cascade,
  applicant_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  message      text check (char_length(message) <= 500),
  status       public.request_status not null default 'pending',
  created_at   timestamptz not null default now(),
  unique (session_id, applicant_id)
);

create table public.session_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions (id) on delete cascade,
  sender_id  uuid not null default auth.uid() references public.users (id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 1000),
  is_preset  boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.session_reviews (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid not null references public.training_sessions (id) on delete cascade,
  reviewer_id       uuid not null default auth.uid() references public.users (id) on delete cascade,
  reviewee_id       uuid not null references public.users (id) on delete cascade,
  control_score     smallint not null check (control_score between 1 and 5),
  punctuality_score smallint not null check (punctuality_score between 1 and 5),
  comment           varchar(300),
  created_at        timestamptz not null default now(),
  unique (session_id, reviewer_id),
  constraint session_reviews_not_self_check check (reviewer_id <> reviewee_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index gyms_location_idx on public.gyms using gist (location);
create index users_base_location_idx on public.users using gist (base_location);
create index user_disciplines_user_id_idx on public.user_disciplines (user_id);
create index training_sessions_custom_location_idx on public.training_sessions using gist (custom_location);
create index training_sessions_open_idx on public.training_sessions (scheduled_at) where status = 'open';
create index training_sessions_creator_id_idx on public.training_sessions (creator_id);
create index training_sessions_matched_partner_id_idx on public.training_sessions (matched_partner_id);
create index training_sessions_gym_id_idx on public.training_sessions (gym_id);
create index session_requests_applicant_id_idx on public.session_requests (applicant_id);
create unique index session_requests_one_accepted_idx on public.session_requests (session_id) where status = 'accepted';
create index session_messages_session_id_created_at_idx on public.session_messages (session_id, created_at);
create index session_reviews_reviewee_id_idx on public.session_reviews (reviewee_id);

-- ---------------------------------------------------------------------------
-- RLS helper functions
-- SECURITY DEFINER so policies on one table can look at another without
-- triggering that table's policies (avoids infinite RLS recursion).
-- ---------------------------------------------------------------------------
create function public.is_session_creator(p_session_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.training_sessions s
    where s.id = p_session_id and s.creator_id = (select auth.uid())
  );
$$;

-- Creator, matched partner, or an applicant whose request is still live.
create function public.is_session_participant(p_session_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.training_sessions s
    where s.id = p_session_id
      and (s.creator_id = (select auth.uid()) or s.matched_partner_id = (select auth.uid()))
  ) or exists (
    select 1 from public.session_requests r
    where r.session_id = p_session_id
      and r.applicant_id = (select auth.uid())
      and r.status in ('pending', 'accepted')
  );
$$;

create function public.has_requested_session(p_session_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.session_requests r
    where r.session_id = p_session_id and r.applicant_id = (select auth.uid())
  );
$$;

-- Open, in the future, not your own, and you fit the creator's weight bounds.
create function public.can_request_session(p_session_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.training_sessions s
    join public.users me on me.id = (select auth.uid())
    where s.id = p_session_id
      and s.status = 'open'
      and s.scheduled_at > now()
      and s.creator_id <> me.id
      and (s.min_partner_weight is null or me.weight_kg >= s.min_partner_weight)
      and (s.max_partner_weight is null or me.weight_kg <= s.max_partner_weight)
  );
$$;

-- Only the two matched athletes can review each other, and only after the session time.
create function public.can_review_session(p_session_id uuid, p_reviewee_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.training_sessions s
    where s.id = p_session_id
      and s.status in ('matched', 'completed')
      and s.scheduled_at < now()
      and (
        (s.creator_id = (select auth.uid()) and s.matched_partner_id = p_reviewee_id)
        or (s.matched_partner_id = (select auth.uid()) and s.creator_id = p_reviewee_id)
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security + column grants
-- ---------------------------------------------------------------------------
alter table public.gyms enable row level security;
alter table public.users enable row level security;
alter table public.user_disciplines enable row level security;
alter table public.training_sessions enable row level security;
alter table public.session_requests enable row level security;
alter table public.session_messages enable row level security;
alter table public.session_reviews enable row level security;

revoke all on public.gyms, public.users, public.user_disciplines, public.training_sessions,
  public.session_requests, public.session_messages, public.session_reviews
  from anon, authenticated;

-- gyms: read-only reference data (managed by admins via service role).
grant select on public.gyms to authenticated;
create policy "gyms are readable by signed-in users"
  on public.gyms for select to authenticated using (true);

-- users: public athlete profile; base_location and email are never readable.
grant select (id, full_name, avatar_url, weight_kg, height_cm, stance, home_gym_id,
              control_rating, completed_sessions_count, is_verified, onboarding_completed_at, created_at)
  on public.users to authenticated;
grant update (full_name, avatar_url, weight_kg, height_cm, stance, home_gym_id,
              base_location, onboarding_completed_at)
  on public.users to authenticated;
create policy "profiles are readable by signed-in users"
  on public.users for select to authenticated using (true);
create policy "users update their own profile"
  on public.users for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- user_disciplines
grant select, delete on public.user_disciplines to authenticated;
-- discipline_slug is updatable so PostgREST upserts (ON CONFLICT DO UPDATE SET <all payload columns>) work.
grant insert (discipline_slug, experience_months, rank_label, equipment),
      update (discipline_slug, experience_months, rank_label, equipment)
  on public.user_disciplines to authenticated;
create policy "disciplines are readable by signed-in users"
  on public.user_disciplines for select to authenticated using (true);
create policy "users add their own disciplines"
  on public.user_disciplines for insert to authenticated with check (user_id = (select auth.uid()));
create policy "users edit their own disciplines"
  on public.user_disciplines for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "users remove their own disciplines"
  on public.user_disciplines for delete to authenticated using (user_id = (select auth.uid()));

-- training_sessions: insert directly; status changes only via RPCs.
grant select on public.training_sessions to authenticated;
grant insert (gym_id, custom_location, discipline_slug, intensity, scheduled_at, rounds_format,
              min_partner_weight, max_partner_weight, notes)
  on public.training_sessions to authenticated;
create policy "open sessions are public; others visible to those involved"
  on public.training_sessions for select to authenticated
  using (
    status = 'open'
    or creator_id = (select auth.uid())
    or matched_partner_id = (select auth.uid())
    or public.has_requested_session(id)
  );
create policy "users create their own future sessions"
  on public.training_sessions for insert to authenticated
  with check (creator_id = (select auth.uid()) and scheduled_at > now());

-- session_requests
grant select on public.session_requests to authenticated;
grant insert (session_id, message), update (status) on public.session_requests to authenticated;
create policy "applicants and session creators see requests"
  on public.session_requests for select to authenticated
  using (applicant_id = (select auth.uid()) or public.is_session_creator(session_id));
create policy "athletes request eligible sessions"
  on public.session_requests for insert to authenticated
  with check (
    applicant_id = (select auth.uid())
    and status = 'pending'
    and public.can_request_session(session_id)
  );
create policy "applicants withdraw their pending requests"
  on public.session_requests for update to authenticated
  using (applicant_id = (select auth.uid()) and status = 'pending')
  with check (applicant_id = (select auth.uid()) and status = 'withdrawn');

-- session_messages
grant select on public.session_messages to authenticated;
grant insert (session_id, content, is_preset) on public.session_messages to authenticated;
create policy "participants read session chat"
  on public.session_messages for select to authenticated
  using (public.is_session_participant(session_id));
create policy "participants post to session chat"
  on public.session_messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.is_session_participant(session_id));

-- session_reviews
grant select on public.session_reviews to authenticated;
grant insert (session_id, reviewee_id, control_score, punctuality_score, comment)
  on public.session_reviews to authenticated;
create policy "reviewers and reviewees see reviews"
  on public.session_reviews for select to authenticated
  using (reviewer_id = (select auth.uid()) or reviewee_id = (select auth.uid()));
create policy "matched athletes review each other after the session"
  on public.session_reviews for insert to authenticated
  with check (reviewer_id = (select auth.uid()) and public.can_review_session(session_id, reviewee_id));

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Create the public profile row when someone signs up.
create function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Control Rating = average of (control + punctuality) / 2 across all reviews received.
create function public.recalculate_control_rating()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Lock the reviewee first so concurrent reviews serialize; the next statement then takes a
  -- fresh snapshot (READ COMMITTED) that includes any review committed while we waited.
  perform 1 from public.users where id = new.reviewee_id for update;

  update public.users u
  set control_rating = coalesce(
        (select round(avg((r.control_score + r.punctuality_score) / 2.0), 2)
         from public.session_reviews r
         where r.reviewee_id = new.reviewee_id),
        5.00),
      completed_sessions_count = u.completed_sessions_count + 1
  where u.id = new.reviewee_id;

  -- Once both athletes have reviewed each other the session is done.
  update public.training_sessions s
  set status = 'completed'
  where s.id = new.session_id
    and s.status = 'matched'
    and (select count(*) from public.session_reviews r where r.session_id = new.session_id) >= 2;

  return new;
end;
$$;

create trigger session_reviews_recalculate_control_rating
  after insert on public.session_reviews
  for each row execute function public.recalculate_control_rating();

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------

-- Session + venue coordinates + creator summary. security_invoker keeps RLS and column grants
-- of the caller in force. Coordinates are only ever the public venue (gym or custom pin).
create view public.session_details with (security_invoker = true) as
select
  s.id,
  s.creator_id,
  s.gym_id,
  s.discipline_slug,
  s.intensity,
  s.scheduled_at,
  s.rounds_format,
  s.min_partner_weight,
  s.max_partner_weight,
  s.notes,
  s.status,
  s.matched_partner_id,
  s.created_at,
  g.name as venue_name,
  g.address as venue_address,
  g.drop_in_fee_cents,
  g.currency,
  extensions.st_y(coalesce(g.location, s.custom_location)::extensions.geometry) as latitude,
  extensions.st_x(coalesce(g.location, s.custom_location)::extensions.geometry) as longitude,
  u.full_name as creator_name,
  u.avatar_url as creator_avatar_url,
  u.weight_kg as creator_weight_kg,
  u.control_rating as creator_control_rating,
  u.completed_sessions_count as creator_completed_sessions,
  u.is_verified as creator_is_verified
from public.training_sessions s
join public.users u on u.id = s.creator_id
left join public.gyms g on g.id = s.gym_id;

revoke all on public.session_details from anon, authenticated;
grant select on public.session_details to authenticated;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Open, future sessions near a point, excluding your own, filtered and sorted by distance.
create function public.get_nearby_sessions(
  user_lat      double precision,
  user_lng      double precision,
  radius_meters double precision default 10000,
  discipline    public.discipline_slug default null,
  user_weight   numeric default null,
  intensity_filter public.session_intensity default null,
  -- Only creators within ±N kg of user_weight (sparring partners of similar size).
  weight_tolerance_kg numeric default null
)
returns table (
  id                         uuid,
  creator_id                 uuid,
  gym_id                     uuid,
  discipline_slug            public.discipline_slug,
  intensity                  public.session_intensity,
  scheduled_at               timestamptz,
  rounds_format              varchar,
  min_partner_weight         numeric,
  max_partner_weight         numeric,
  notes                      text,
  venue_name                 varchar,
  venue_address              text,
  drop_in_fee_cents          int,
  currency                   varchar,
  latitude                   double precision,
  longitude                  double precision,
  distance_meters            double precision,
  creator_name               varchar,
  creator_avatar_url         text,
  creator_weight_kg          numeric,
  creator_control_rating     numeric,
  creator_completed_sessions int,
  creator_is_verified        boolean
)
language sql stable set search_path = '' as $$
  with origin as (
    select extensions.st_setsrid(extensions.st_makepoint(user_lng, user_lat), 4326)::extensions.geography as point
  ),
  candidates as (
    select s.*, g.name as g_name, g.address as g_address, g.drop_in_fee_cents as g_fee, g.currency as g_currency,
           coalesce(g.location, s.custom_location) as venue
    from public.training_sessions s
    left join public.gyms g on g.id = s.gym_id
    where s.status = 'open'
      and s.scheduled_at > now()
      and s.creator_id <> (select auth.uid())
      and (get_nearby_sessions.discipline is null or s.discipline_slug = get_nearby_sessions.discipline)
      and (intensity_filter is null or s.intensity = intensity_filter)
      and (get_nearby_sessions.user_weight is null or (
            (s.min_partner_weight is null or get_nearby_sessions.user_weight >= s.min_partner_weight)
        and (s.max_partner_weight is null or get_nearby_sessions.user_weight <= s.max_partner_weight)))
  )
  select
    c.id, c.creator_id, c.gym_id, c.discipline_slug, c.intensity, c.scheduled_at, c.rounds_format,
    c.min_partner_weight, c.max_partner_weight, c.notes,
    c.g_name, c.g_address, c.g_fee, c.g_currency,
    extensions.st_y(c.venue::extensions.geometry),
    extensions.st_x(c.venue::extensions.geometry),
    extensions.st_distance(c.venue, o.point),
    u.full_name, u.avatar_url, u.weight_kg, u.control_rating, u.completed_sessions_count, u.is_verified
  from candidates c
  cross join origin o
  join public.users u on u.id = c.creator_id
  where extensions.st_dwithin(c.venue, o.point, radius_meters)
    and (weight_tolerance_kg is null or user_weight is null
         or abs(u.weight_kg - user_weight) <= weight_tolerance_kg)
  order by extensions.st_distance(c.venue, o.point), c.scheduled_at
  limit 100;
$$;

-- Gyms near a point, for the venue picker.
create function public.get_nearby_gyms(
  user_lat      double precision,
  user_lng      double precision,
  radius_meters double precision default 15000
)
returns table (
  id                uuid,
  name              varchar,
  address           text,
  drop_in_fee_cents int,
  currency          varchar,
  is_partner        boolean,
  latitude          double precision,
  longitude         double precision,
  distance_meters   double precision
)
language sql stable set search_path = '' as $$
  with origin as (
    select extensions.st_setsrid(extensions.st_makepoint(user_lng, user_lat), 4326)::extensions.geography as point
  )
  select g.id, g.name, g.address, g.drop_in_fee_cents, g.currency, g.is_partner,
         extensions.st_y(g.location::extensions.geometry),
         extensions.st_x(g.location::extensions.geometry),
         extensions.st_distance(g.location, o.point)
  from public.gyms g
  cross join origin o
  where extensions.st_dwithin(g.location, o.point, radius_meters)
  order by extensions.st_distance(g.location, o.point)
  limit 50;
$$;

-- Creates a session at a custom pin. PostgREST can't build geography values from JSON, so the
-- client sends coordinates and this wraps them. Gym-based sessions can use either path.
create function public.create_training_session(
  discipline         public.discipline_slug,
  intensity          public.session_intensity,
  scheduled_at       timestamptz,
  gym_id             uuid default null,
  latitude           double precision default null,
  longitude          double precision default null,
  rounds_format      varchar default null,
  min_partner_weight numeric default null,
  max_partner_weight numeric default null,
  notes              text default null
)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_location extensions.geography;
  v_id uuid;
begin
  if (gym_id is null) = (latitude is null or longitude is null) then
    raise exception 'Provide either a gym or a custom location' using errcode = '22023';
  end if;

  if gym_id is null then
    v_location := extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography;
  end if;

  insert into public.training_sessions (
    gym_id, custom_location, discipline_slug, intensity, scheduled_at,
    rounds_format, min_partner_weight, max_partner_weight, notes
  ) values (
    create_training_session.gym_id, v_location, create_training_session.discipline,
    create_training_session.intensity, create_training_session.scheduled_at,
    create_training_session.rounds_format, create_training_session.min_partner_weight,
    create_training_session.max_partner_weight, create_training_session.notes
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Creator picks a partner: that request is accepted, all other pending ones declined, session matched.
create function public.accept_session_request(request_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_request public.session_requests;
  v_session public.training_sessions;
begin
  select * into v_request from public.session_requests r where r.id = accept_session_request.request_id;
  if not found then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;

  -- Lock the session so two concurrent accepts can't both match it.
  select * into v_session from public.training_sessions s where s.id = v_request.session_id for update;

  if v_session.creator_id is distinct from (select auth.uid()) then
    raise exception 'Only the session creator can accept requests' using errcode = '42501';
  end if;
  if v_session.status <> 'open' then
    raise exception 'Session is no longer open' using errcode = '22023';
  end if;
  if v_request.status <> 'pending' then
    raise exception 'Request is no longer pending' using errcode = '22023';
  end if;

  update public.session_requests set status = 'accepted' where id = v_request.id;
  update public.session_requests set status = 'declined'
    where session_id = v_session.id and id <> v_request.id and status = 'pending';
  update public.training_sessions
    set status = 'matched', matched_partner_id = v_request.applicant_id
    where id = v_session.id;
end;
$$;

-- Creator cancels an upcoming open/matched session; outstanding requests are declined.
create function public.cancel_training_session(session_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_session public.training_sessions;
begin
  select * into v_session from public.training_sessions s where s.id = cancel_training_session.session_id for update;
  if not found then
    raise exception 'Session not found' using errcode = 'P0002';
  end if;
  if v_session.creator_id is distinct from (select auth.uid()) then
    raise exception 'Only the session creator can cancel' using errcode = '42501';
  end if;
  if v_session.status not in ('open', 'matched') then
    raise exception 'Session can no longer be cancelled' using errcode = '22023';
  end if;

  update public.training_sessions set status = 'cancelled' where id = v_session.id;
  update public.session_requests set status = 'declined'
    where public.session_requests.session_id = v_session.id and status = 'pending';
end;
$$;

-- Function privileges: signed-in users only.
revoke execute on function
  public.is_session_creator(uuid),
  public.is_session_participant(uuid),
  public.has_requested_session(uuid),
  public.can_request_session(uuid),
  public.can_review_session(uuid, uuid),
  public.get_nearby_sessions(double precision, double precision, double precision, public.discipline_slug, numeric, public.session_intensity, numeric),
  public.get_nearby_gyms(double precision, double precision, double precision),
  public.create_training_session(public.discipline_slug, public.session_intensity, timestamptz, uuid, double precision, double precision, varchar, numeric, numeric, text),
  public.accept_session_request(uuid),
  public.cancel_training_session(uuid)
  from public, anon;
grant execute on function
  public.is_session_creator(uuid),
  public.is_session_participant(uuid),
  public.has_requested_session(uuid),
  public.can_request_session(uuid),
  public.can_review_session(uuid, uuid),
  public.get_nearby_sessions(double precision, double precision, double precision, public.discipline_slug, numeric, public.session_intensity, numeric),
  public.get_nearby_gyms(double precision, double precision, double precision),
  public.create_training_session(public.discipline_slug, public.session_intensity, timestamptz, uuid, double precision, double precision, varchar, numeric, numeric, text),
  public.accept_session_request(uuid),
  public.cancel_training_session(uuid)
  to authenticated;

revoke execute on function public.handle_new_auth_user(), public.recalculate_control_rating() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: stream chat inserts (Realtime enforces the SELECT policy per subscriber).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.session_messages;
  end if;
end;
$$;
