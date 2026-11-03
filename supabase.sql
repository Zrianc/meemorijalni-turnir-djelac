-- =====================================================================
--  Memorijal „Đelac” – baza podataka (Supabase)
--  Pokreni CIJELU skriptu u Supabase -> SQL Editor -> New query -> Run.
--  PRIJE POKRETANJA: na dnu upiši e-mail organizatora (admina).
-- =====================================================================

-- ---------- ekipe (prijave) ----------
create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 2 and 60),
  captain     text check (captain is null or char_length(captain) <= 80),
  phone       text check (phone is null or char_length(phone) <= 30),
  email       text check (email is null or char_length(email) <= 120),
  color       text check (color is null or char_length(color) <= 40),
  note        text check (note is null or char_length(note) <= 500),
  players     jsonb not null default '[]'::jsonb
              check (jsonb_typeof(players) = 'array' and jsonb_array_length(players) <= 25),
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  seeded      boolean not null default false,
  created_at  timestamptz not null default now()
);
create unique index if not exists teams_name_unique on public.teams (lower(trim(name)));

-- ---------- turnir (postavke, ždrijeb, raspored, rezultati) ----------
create table if not exists public.tournament (
  id          int primary key check (id = 1),
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
insert into public.tournament (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing;

-- ---------- administratori ----------
create table if not exists public.admins (email text primary key);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- pristup za API (radi i ako je "Automatically expose new tables" isključeno) ----------
grant usage on schema public to anon, authenticated;
grant select, insert on public.teams to anon;
grant select, insert, update, delete on public.teams to authenticated;
grant select on public.tournament to anon;
grant select, insert, update, delete on public.tournament to authenticated;
revoke all on public.admins from anon, authenticated;

-- ---------- sigurnosna pravila (RLS) ----------
alter table public.teams      enable row level security;
alter table public.tournament enable row level security;
alter table public.admins     enable row level security;   -- nitko izvana ne čita popis admina

drop policy if exists tournament_read  on public.tournament;
drop policy if exists tournament_admin on public.tournament;
create policy tournament_read  on public.tournament for select using (true);
create policy tournament_admin on public.tournament for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists teams_register on public.teams;
drop policy if exists teams_admin    on public.teams;
-- javna prijava: samo nova ekipa "na čekanju", samo dok su prijave otvorene i prije ždrijeba
create policy teams_register on public.teams for insert to anon, authenticated
  with check (
    status = 'pending' and seeded = false
    and coalesce((select (t.data -> 'settings' ->> 'registrationOpen')::boolean
                  from public.tournament t where t.id = 1), true)
    and (select t.data ->> 'drawnAt' from public.tournament t where t.id = 1) is null
  );
-- organizator smije sve
create policy teams_admin on public.teams for all
  using (public.is_admin()) with check (public.is_admin());

-- javni popis ekipa BEZ mobitela, e-maila i napomene
create or replace view public.teams_public as
  select id, name, color, players, status, seeded, created_at
  from public.teams
  where status <> 'rejected';
grant select on public.teams_public to anon, authenticated;

-- ---------- uživo osvježavanje rezultata ----------
do $$ begin
  alter publication supabase_realtime add table public.tournament;
exception when others then null; end $$;

-- =====================================================================
--  UPIŠI E-MAIL ORGANIZATORA (isti kojim ćeš se prijavljivati u aplikaciju).
--  Za više organizatora dodaj više redaka.
-- =====================================================================
insert into public.admins (email) values
  ('memorijal.djelac@gmail.com')
on conflict do nothing;
