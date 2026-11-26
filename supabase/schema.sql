-- =============================================================================
-- MOB — Esquema PostgreSQL + RLS + Realtime para Supabase (MVP + Base Fase 2)
-- =============================================================================

create extension if not exists "pgcrypto";

-- 1. Perfiles de usuario (Inercia SDT + 4 Atributos estilo GTA)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Jugador',
  momentum_score int not null default 42 check (momentum_score between 0 and 100),
  attribute_xp jsonb not null default '{"energia": 120, "fuerza": 100, "enfoque": 110, "disciplina": 105}'::jsonb,
  invite_code text unique not null default upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6)),
  updated_at timestamptz not null default now()
);

-- 2. Hábitos calibrados por niveles Bronce / Plata / Oro
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  icon text not null default 'footprints',
  time_of_day text not null check (time_of_day in ('morning', 'afternoon', 'evening', 'anytime')),
  primary_attribute text not null check (primary_attribute in ('energia', 'fuerza', 'enfoque', 'disciplina')),
  secondary_attribute text check (secondary_attribute in ('energia', 'fuerza', 'enfoque', 'disciplina')),
  tiers jsonb not null,
  is_shared_duo boolean not null default false,
  active_days int[] not null default '{0,1,2,3,4,5,6}',
  created_at timestamptz not null default now()
);

-- 3. Registros diarios de hábitos
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  log_date date not null,
  tier text not null check (tier in ('bronze', 'silver', 'gold')),
  minutes_logged int not null default 5,
  completed_with_duo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

-- 4. Tareas y Misiones Principales / Micro-pasos anti-aplazamiento
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  scheduled_date date not null,
  time_of_day text not null default 'anytime',
  optional_time text,
  is_main_mission boolean not null default false,
  primary_attribute text not null default 'enfoque',
  completed boolean not null default false,
  postpone_count int not null default 0,
  micro_steps jsonb not null default '[]'::jsonb,
  duo_sos_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- 5. Vínculo 1-a-1 Dúo (estilo Lucía y Jason)
create table if not exists public.duo_links (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  synergy_days int not null default 1,
  last_nudge jsonb,
  created_at timestamptz not null default now(),
  unique (user_a, user_b)
);

-- 6. Crew de amigos (privacidad por defecto: comparte solo % y medallas, nunca tareas privadas)
create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  challenge_title text,
  target_medals int not null default 25,
  created_at timestamptz not null default now()
);

create table if not exists public.crew_members (
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (crew_id, user_id)
);

-- =============================================================================
-- RESERVADO FASE 2: Antropometría US Navy + Fuerza (Gym) + Nutrición (USDA / OFF)
-- =============================================================================
create table if not exists public.body_metrics_phase2 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  measured_at date not null default current_date,
  sex text not null default 'male' check (sex in ('male', 'female')),
  height_cm numeric(5,2) not null,
  weight_kg numeric(5,2) not null,
  neck_cm numeric(5,2) not null,
  waist_cm numeric(5,2) not null,
  hip_cm numeric(5,2),
  shoulders_cm numeric(5,2),
  chest_cm numeric(5,2),
  biceps_cm numeric(5,2),
  thigh_cm numeric(5,2),
  calf_cm numeric(5,2),
  estimated_body_fat_pct numeric(4,1),
  waist_to_height_ratio numeric(4,3) not null default 0,
  shoulder_to_waist_ratio numeric(4,2),
  morphological_profile text not null default 'balanced' check (
    morphological_profile in ('athletic-meso', 'lean-agile', 'power-enduro', 'balanced')
  ),
  mode_used text not null default 'solo' check (mode_used in ('solo', 'assisted')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.gym_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  muscle_group text not null check (muscle_group in ('push', 'pull', 'legs', 'core')),
  is_compound boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.gym_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.gym_exercises(id) on delete cascade,
  logged_date date not null default current_date,
  weight_kg numeric(6,2) not null check (weight_kg > 0),
  reps int not null check (reps > 0),
  estimated_1rm_kg numeric(6,1) not null,
  volume_kg numeric(8,1) not null,
  is_pr boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.nutrition_logs_phase2 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  logged_date date not null default current_date,
  source text not null check (source in ('usda_fdc', 'open_food_facts')),
  external_id text not null,
  food_name text not null,
  grams numeric(6,1) not null,
  kcal numeric(6,1) not null,
  protein_g numeric(5,1) not null,
  carbs_g numeric(5,1) not null,
  fat_g numeric(5,1) not null
);

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.tasks enable row level security;
alter table public.body_metrics_phase2 enable row level security;
alter table public.gym_exercises enable row level security;
alter table public.gym_sets enable row level security;

create policy "Users manage own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users manage own habits" on public.habits for all using (auth.uid() = user_id);
create policy "Users manage own habit logs" on public.habit_logs for all using (auth.uid() = user_id);
create policy "Users manage own tasks" on public.tasks for all using (auth.uid() = user_id);
create policy "Users manage own body metrics" on public.body_metrics_phase2 for all using (auth.uid() = user_id);
create policy "Users manage own gym exercises" on public.gym_exercises for all using (auth.uid() = user_id);
create policy "Users manage own gym sets" on public.gym_sets for all using (auth.uid() = user_id);
