alter table public.clients
  add column if not exists first_ar text,
  add column if not exists last_ar text,
  add column if not exists address text;
