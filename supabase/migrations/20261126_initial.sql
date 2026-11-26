create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'operator');
create type public.request_status as enum (
  'draft', 'in_progress', 'sms_required', 'payment_confirmation',
  'completed', 'error'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'operator',
  full_name text,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  cin text,
  phone text,
  land_title text,
  cin_front_url text,
  cin_back_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.demands (
  id text primary key,
  client_id uuid not null references public.clients(id),
  owner_id uuid not null references auth.users(id) on delete cascade,
  land_title text not null,
  status public.request_status not null default 'draft',
  ancfcc_fee numeric(12,2) not null default 0,
  service_fee numeric(12,2) not null default 0,
  payment_confirmed boolean not null default false,
  certificate_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.demand_events (
  id bigint generated always as identity primary key,
  demand_id text not null references public.demands(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.demands enable row level security;
alter table public.demand_events enable row level security;

create policy "users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "operators manage own clients"
  on public.clients for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "operators manage own demands"
  on public.demands for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "operators read own demand events"
  on public.demand_events for select
  using (
    exists (
      select 1 from public.demands d
      where d.id = demand_id and d.owner_id = auth.uid()
    )
  );
