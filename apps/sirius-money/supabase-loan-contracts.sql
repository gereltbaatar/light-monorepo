-- expense-tracker — loan contracts: contract details, PDF storage, wider periods
-- Run manually in Supabase Dashboard → SQL Editor, after supabase-loans.sql. Safe to re-run.

-- 1. Periods ---------------------------------------------------------------

alter type public.loan_period add value if not exists 'semimonthly';
alter type public.loan_period add value if not exists 'quarterly';
alter type public.loan_period add value if not exists 'yearly';
alter type public.loan_period add value if not exists 'once';

-- 2. Contract details ------------------------------------------------------

alter table public.ex_loans
  add column if not exists loan_type           text,
  add column if not exists contract_number     text,
  add column if not exists contract_date       date,
  add column if not exists maturity_date       date,
  add column if not exists interest_rate       numeric(6, 3),
  add column if not exists interest_rate_unit  text,
  add column if not exists fees                numeric(14, 2),
  add column if not exists contract_path       text;

alter table public.ex_loans drop constraint if exists loans_interest_rate_valid;
alter table public.ex_loans add constraint loans_interest_rate_valid check (
  (interest_rate is null or interest_rate between 0 and 1000)
  and (interest_rate_unit is null or interest_rate_unit in ('monthly', 'yearly'))
);
alter table public.ex_loans drop constraint if exists loans_fees_valid;
alter table public.ex_loans add constraint loans_fees_valid check (fees is null or fees >= 0);

-- Contract schedules split each payment, and the parts need not be equal.
alter table public.ex_loan_payments
  add column if not exists principal_part  numeric(14, 2),
  add column if not exists interest_part   numeric(14, 2);

-- 3. Progress view ---------------------------------------------------------

-- l.* is expanded when the view is created, so it must be rebuilt to pick up the new columns.
drop view if exists public.ex_loan_progress;
create view public.ex_loan_progress
with (security_invoker = true) as
select
  l.*,
  coalesce(sum(p.amount), 0)::numeric(14, 2) as total_amount,
  coalesce(sum(p.amount) filter (where p.paid_at is not null), 0)::numeric(14, 2) as paid_amount,
  count(p.id) filter (where p.paid_at is not null)::integer as paid_count,
  min(p.due_date) filter (where p.paid_at is null) as next_due_date
from public.ex_loans l
left join public.ex_loan_payments p on p.loan_id = l.id
group by l.id;

-- 4. Contract storage ------------------------------------------------------

-- Private: contracts carry national ID numbers and addresses.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('loan-contracts', 'loan-contracts', false, 7340032, array['application/pdf'])
on conflict (id) do nothing;

-- Files live under <user id>/, so the first folder decides ownership.
drop policy if exists "loan_contracts_select_own" on storage.objects;
create policy "loan_contracts_select_own" on storage.objects
  for select using (bucket_id = 'loan-contracts' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "loan_contracts_insert_own" on storage.objects;
create policy "loan_contracts_insert_own" on storage.objects
  for insert with check (bucket_id = 'loan-contracts' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "loan_contracts_delete_own" on storage.objects;
create policy "loan_contracts_delete_own" on storage.objects
  for delete using (bucket_id = 'loan-contracts' and (storage.foldername(name))[1] = auth.uid()::text);

notify pgrst, 'reload schema';
