-- expense-tracker — preferred currencies on profiles
-- Run manually in Supabase Dashboard → SQL Editor, after supabase-schema.sql.
-- Safe to re-run.

alter table public.profiles
  add column if not exists preferred_currencies text[] not null default '{USD}';

alter table public.profiles
  drop constraint if exists profiles_preferred_currencies_valid;

alter table public.profiles
  add constraint profiles_preferred_currencies_valid check (
    cardinality(preferred_currencies) <= 60
    and array_to_string(preferred_currencies, ',') ~ '^([A-Z]{3}(,[A-Z]{3})*)?$'
  );

comment on column public.profiles.preferred_currencies is
  'ISO 4217 codes offered next to MNT in amount inputs; rates come from Mongolbank.';

notify pgrst, 'reload schema';
