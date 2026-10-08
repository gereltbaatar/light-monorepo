-- expense-tracker — receipt line items on transactions
-- Run manually in Supabase Dashboard → SQL Editor, after supabase-transactions.sql.
-- Safe to re-run.

alter table public.ex_transactions
  add column if not exists items jsonb not null default '[]'::jsonb;

alter table public.ex_transactions
  drop constraint if exists transactions_items_is_array;

alter table public.ex_transactions
  add constraint transactions_items_is_array check (jsonb_typeof(items) = 'array');

comment on column public.ex_transactions.items is
  'Receipt line items: [{ name, quantity, unitPrice, total }]. Empty for manual entries.';

-- Make PostgREST pick up the new column immediately.
notify pgrst, 'reload schema';
