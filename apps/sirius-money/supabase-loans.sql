-- expense-tracker — loans and their repayment schedule
-- Run manually in Supabase Dashboard → SQL Editor, after supabase-schema.sql
-- and supabase-transactions.sql (reuses public.set_updated_at() and ex_transactions).

-- 1. Types -----------------------------------------------------------------

create type public.loan_period as enum ('weekly', 'monthly');

-- 2. Loans -----------------------------------------------------------------

create table public.ex_loans (
  id                  uuid                primary key default gen_random_uuid(),
  user_id             uuid                not null references auth.users(id) on delete cascade,
  lender              text                not null,
  principal           numeric(14, 2)      not null,
  installment_amount  numeric(14, 2)      not null,
  installment_count   integer             not null,
  period              public.loan_period  not null default 'monthly',
  first_due_date      date                not null,
  created_at          timestamptz         not null default now(),
  updated_at          timestamptz         not null default now(),

  constraint loans_lender_not_blank check (length(btrim(lender)) > 0),
  constraint loans_principal_positive check (principal > 0),
  constraint loans_installment_positive check (installment_amount > 0),
  constraint loans_installment_count_range check (installment_count between 1 and 120)
);

create index loans_user_idx on public.ex_loans (user_id, created_at desc);

create trigger loans_set_updated_at
  before update on public.ex_loans
  for each row execute function public.set_updated_at();

-- 3. Payments --------------------------------------------------------------

-- transaction_id links the expense created when a payment is marked paid.
create table public.ex_loan_payments (
  id              uuid            primary key default gen_random_uuid(),
  loan_id         uuid            not null references public.ex_loans(id) on delete cascade,
  user_id         uuid            not null references auth.users(id) on delete cascade,
  seq             integer         not null,
  due_date        date            not null,
  amount          numeric(14, 2)  not null,
  paid_at         timestamptz,
  transaction_id  uuid            references public.ex_transactions(id) on delete set null,
  created_at      timestamptz     not null default now(),

  constraint loan_payments_amount_positive check (amount > 0),
  constraint loan_payments_seq_unique unique (loan_id, seq)
);

create index loan_payments_loan_idx on public.ex_loan_payments (loan_id, seq);

-- 4. Progress view ---------------------------------------------------------

-- security_invoker makes the view obey the caller's RLS instead of the owner's.
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

-- 5. Row Level Security ----------------------------------------------------

alter table public.ex_loans enable row level security;
alter table public.ex_loan_payments enable row level security;

create policy "loans_select_own" on public.ex_loans
  for select using (auth.uid() = user_id);
create policy "loans_insert_own" on public.ex_loans
  for insert with check (auth.uid() = user_id);
create policy "loans_update_own" on public.ex_loans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "loans_delete_own" on public.ex_loans
  for delete using (auth.uid() = user_id);

create policy "loan_payments_select_own" on public.ex_loan_payments
  for select using (auth.uid() = user_id);

-- The loan must also belong to the caller, or a row could be attached to someone else's loan.
create policy "loan_payments_insert_own" on public.ex_loan_payments
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.ex_loans l where l.id = loan_id and l.user_id = auth.uid())
  );
create policy "loan_payments_update_own" on public.ex_loan_payments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "loan_payments_delete_own" on public.ex_loan_payments
  for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';
