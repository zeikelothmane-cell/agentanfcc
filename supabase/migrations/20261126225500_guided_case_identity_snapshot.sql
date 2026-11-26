alter table public.guided_cases
  add column if not exists last_fr text,
  add column if not exists first_fr text,
  add column if not exists identity_number text;
