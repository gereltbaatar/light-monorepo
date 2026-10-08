-- Sirius core: extends sirius-money's profiles so every app shares one profile.
-- Run sirius-money's supabase-*.sql first; this only adds columns.
-- Run by hand in the Supabase SQL Editor; nothing auto-pushes.

alter table public.profiles
  add column if not exists timezone       text     not null default 'Asia/Ulaanbaatar',
  add column if not exists currency       text     not null default 'MNT',
  add column if not exists week_starts_on smallint not null default 1;

alter table public.profiles
  drop constraint if exists profiles_week_starts_on_valid;

alter table public.profiles
  add constraint profiles_week_starts_on_valid check (week_starts_on between 0 and 6);

comment on column public.profiles.timezone is 'Decides what "today" means for every Sirius app.';
comment on column public.profiles.week_starts_on is '0 = Sunday, 1 = Monday.';

notify pgrst, 'reload schema';
