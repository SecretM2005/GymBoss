-- ─────────────────────────────────────────────────────────────────────────────
-- GymBoss – Supabase Schema  (idempotent: safe to re-run)
-- Run this in the Supabase SQL editor (Project → SQL Editor → New Query)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('trainer', 'sportler')),
  name       text not null default '',
  initials   text not null default '',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "Authenticated users can read all profiles" on public.profiles;
drop policy if exists "Users can insert own profile"              on public.profiles;
drop policy if exists "Users can update own profile"             on public.profiles;

create policy "Authenticated users can read all profiles"
  on public.profiles for select to authenticated using (true);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ─── athletes ────────────────────────────────────────────────────────────────
create table if not exists public.athletes (
  id           uuid primary key default gen_random_uuid(),
  trainer_id   uuid not null references public.profiles(id) on delete cascade,
  profile_id   uuid references public.profiles(id) on delete set null,
  name         text not null,
  initials     text not null default '',
  sportart     text,
  ziel         text,
  geburtsdatum text,
  created_at   timestamptz not null default now()
);
alter table public.athletes enable row level security;

drop policy if exists "Trainers can manage own athletes"       on public.athletes;
drop policy if exists "Sportler can read own athlete record"   on public.athletes;
drop policy if exists "Sportler can update own athlete record" on public.athletes;

create policy "Trainers can manage own athletes"
  on public.athletes for all using (trainer_id = auth.uid());
create policy "Sportler can read own athlete record"
  on public.athletes for select using (profile_id = auth.uid());
create policy "Sportler can update own athlete record"
  on public.athletes for update using (profile_id = auth.uid());

-- ─── training_plans ──────────────────────────────────────────────────────────
create table if not exists public.training_plans (
  id           uuid primary key default gen_random_uuid(),
  trainer_id   uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  beschreibung text,
  sportart     text,
  startdatum   text,
  created_at   timestamptz not null default now()
);
alter table public.training_plans enable row level security;

-- Only the trainer policy here — the sportler policy references plan_athletes
-- which does not exist yet. It is added below after plan_athletes is created.
drop policy if exists "Trainers can manage own plans"    on public.training_plans;
drop policy if exists "Sportler can read assigned plans" on public.training_plans;

create policy "Trainers can manage own plans"
  on public.training_plans for all using (trainer_id = auth.uid());

-- ─── plan_athletes ────────────────────────────────────────────────────────────
create table if not exists public.plan_athletes (
  plan_id    uuid not null references public.training_plans(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  primary key (plan_id, athlete_id)
);
alter table public.plan_athletes enable row level security;

drop policy if exists "Trainers can manage plan athlete assignments" on public.plan_athletes;
drop policy if exists "Sportler can read own plan assignments"       on public.plan_athletes;

create policy "Trainers can manage plan athlete assignments"
  on public.plan_athletes for all using (
    exists (select 1 from public.training_plans where id = plan_id and trainer_id = auth.uid())
  );
create policy "Sportler can read own plan assignments"
  on public.plan_athletes for select using (
    exists (select 1 from public.athletes where id = athlete_id and profile_id = auth.uid())
  );

-- Sportler policy for training_plans — added here now that plan_athletes exists
create policy "Sportler can read assigned plans"
  on public.training_plans for select using (
    exists (
      select 1 from public.athletes a
      join public.plan_athletes pa on pa.athlete_id = a.id
      where pa.plan_id = id and a.profile_id = auth.uid()
    )
  );

-- ─── plan_wochen ─────────────────────────────────────────────────────────────
create table if not exists public.plan_wochen (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references public.training_plans(id) on delete cascade,
  wochennummer int not null,
  notizen      text not null default ''
);
alter table public.plan_wochen enable row level security;

drop policy if exists "Trainers can manage plan weeks"            on public.plan_wochen;
drop policy if exists "Sportler can read weeks of assigned plans" on public.plan_wochen;

create policy "Trainers can manage plan weeks"
  on public.plan_wochen for all using (
    exists (select 1 from public.training_plans where id = plan_id and trainer_id = auth.uid())
  );
create policy "Sportler can read weeks of assigned plans"
  on public.plan_wochen for select using (
    exists (
      select 1 from public.training_plans tp
      join public.plan_athletes pa on pa.plan_id = tp.id
      join public.athletes a on a.id = pa.athlete_id
      where tp.id = plan_id and a.profile_id = auth.uid()
    )
  );

-- ─── einheiten ───────────────────────────────────────────────────────────────
create table if not exists public.einheiten (
  id                 uuid primary key default gen_random_uuid(),
  woche_id           uuid not null references public.plan_wochen(id) on delete cascade,
  template_id        uuid,
  name               text not null,
  datum              text,
  warmup             jsonb not null default '[]',
  haupteinheit       jsonb not null default '[]',
  cooldown           jsonb not null default '[]',
  sportler_overrides jsonb not null default '{}'
);
alter table public.einheiten enable row level security;

drop policy if exists "Trainers can manage einheiten"                 on public.einheiten;
drop policy if exists "Sportler can read einheiten in assigned plans" on public.einheiten;

create policy "Trainers can manage einheiten"
  on public.einheiten for all using (
    exists (
      select 1 from public.plan_wochen pw
      join public.training_plans tp on tp.id = pw.plan_id
      where pw.id = woche_id and tp.trainer_id = auth.uid()
    )
  );
create policy "Sportler can read einheiten in assigned plans"
  on public.einheiten for select using (
    exists (
      select 1 from public.plan_wochen pw
      join public.training_plans tp on tp.id = pw.plan_id
      join public.plan_athletes pa on pa.plan_id = tp.id
      join public.athletes a on a.id = pa.athlete_id
      where pw.id = woche_id and a.profile_id = auth.uid()
    )
  );

-- ─── session_logs ─────────────────────────────────────────────────────────────
create table if not exists public.session_logs (
  id            uuid primary key default gen_random_uuid(),
  einheit_id    text not null,
  athlete_id    uuid not null references public.athletes(id) on delete cascade,
  workout_id    text not null,
  datum         text not null,
  bewertung     int not null check (bewertung between 1 and 5),
  rpe           int not null check (rpe between 1 and 10),
  notiz         text,
  abgeschlossen boolean not null default false,
  created_at    timestamptz not null default now()
);
alter table public.session_logs enable row level security;

drop policy if exists "Sportler can manage own logs"          on public.session_logs;
drop policy if exists "Trainers can read their athletes logs" on public.session_logs;

create policy "Sportler can manage own logs"
  on public.session_logs for all using (
    exists (select 1 from public.athletes where id = athlete_id and profile_id = auth.uid())
  );
create policy "Trainers can read their athletes logs"
  on public.session_logs for select using (
    exists (select 1 from public.athletes where id = athlete_id and trainer_id = auth.uid())
  );

-- ─── nachrichten ─────────────────────────────────────────────────────────────
create table if not exists public.nachrichten (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  sender_name   text not null,
  empfaenger_id uuid not null references public.profiles(id) on delete cascade,
  plan_id       uuid references public.training_plans(id) on delete set null,
  einheit_id    text,
  text          text not null,
  datum         timestamptz not null default now(),
  gelesen       boolean not null default false
);
alter table public.nachrichten enable row level security;

drop policy if exists "Users can read own messages"          on public.nachrichten;
drop policy if exists "Users can send messages"              on public.nachrichten;
drop policy if exists "Recipients can mark messages as read" on public.nachrichten;

create policy "Users can read own messages"
  on public.nachrichten for select using (
    sender_id = auth.uid() or empfaenger_id = auth.uid()
  );
create policy "Users can send messages"
  on public.nachrichten for insert with check (sender_id = auth.uid());
create policy "Recipients can mark messages as read"
  on public.nachrichten for update using (empfaenger_id = auth.uid());

-- ─── einheit_templates ───────────────────────────────────────────────────────
create table if not exists public.einheit_templates (
  id           uuid primary key default gen_random_uuid(),
  trainer_id   uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  warmup       jsonb not null default '[]',
  haupteinheit jsonb not null default '[]',
  cooldown     jsonb not null default '[]',
  created_at   timestamptz not null default now()
);
alter table public.einheit_templates enable row level security;

drop policy if exists "Trainers can manage own einheit templates" on public.einheit_templates;

create policy "Trainers can manage own einheit templates"
  on public.einheit_templates for all using (trainer_id = auth.uid());

-- ─── uebung_templates ────────────────────────────────────────────────────────
create table if not exists public.uebung_templates (
  id           uuid primary key default gen_random_uuid(),
  trainer_id   uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  beschreibung text,
  parameter    jsonb not null default '[]',
  created_at   timestamptz not null default now()
);
alter table public.uebung_templates enable row level security;

drop policy if exists "Trainers can manage own exercise templates" on public.uebung_templates;

create policy "Trainers can manage own exercise templates"
  on public.uebung_templates for all using (trainer_id = auth.uid());

-- ─── Helper: look up a trainer's profile ID by email ─────────────────────────
-- Called during sportler registration to link them to their trainer.
create or replace function public.get_profile_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select au.id
  from auth.users au
  join public.profiles p on p.id = au.id
  where lower(au.email) = lower(p_email)
    and p.role = 'trainer'
  limit 1;
$$;
