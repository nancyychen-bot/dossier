-- Dossier schema
-- Run this in your Supabase SQL editor to set up the database.

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── People ─────────────────────────────────────────────────────────────────
create table public.people (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Stage 1: Quick capture
  name          text not null,
  role          text,
  company       text,
  met_where     text,
  city          text,
  notes         text,

  -- Stage 2: Enrichment
  email         text,
  phone         text,
  website       text,
  linkedin_url  text,
  instagram     text,
  twitter       text,
  portrait_url  text,

  -- Status
  status        text not null default 'incomplete'
                  check (status in ('incomplete', 'acquaintance', 'friend')),
  captured_at   timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger people_updated_at
  before update on public.people
  for each row execute function public.handle_updated_at();

-- ─── Meetings ───────────────────────────────────────────────────────────────
create table public.meetings (
  id          uuid primary key default uuid_generate_v4(),
  person_id   uuid not null references public.people(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),

  met_on      date not null,
  location    text,
  notes       text not null default ''
);

-- ─── Follow-ups ─────────────────────────────────────────────────────────────
create table public.followups (
  id          uuid primary key default uuid_generate_v4(),
  person_id   uuid not null references public.people(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  text        text not null,
  done        boolean not null default false
);

-- ─── Row Level Security ──────────────────────────────────────────────────────
alter table public.people   enable row level security;
alter table public.meetings enable row level security;
alter table public.followups enable row level security;

-- People: users own their own rows
create policy "people: own rows" on public.people
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Meetings: users own their own rows
create policy "meetings: own rows" on public.meetings
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Follow-ups: users own their own rows
create policy "followups: own rows" on public.followups
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Helper views ────────────────────────────────────────────────────────────
-- Entry number: sequential per-user, ordered by created_at
create view public.people_with_entry_num as
  select
    *,
    row_number() over (partition by user_id order by created_at asc) as entry_num
  from public.people;

-- Status derivation: incomplete → acquaintance when any contact info is present
-- (This is a reference query; the app handles it client-side for v1)
-- A person should be promoted to 'acquaintance' when:
--   email IS NOT NULL OR phone IS NOT NULL OR linkedin_url IS NOT NULL OR website IS NOT NULL
