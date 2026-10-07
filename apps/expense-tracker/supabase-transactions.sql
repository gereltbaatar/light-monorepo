-- =========================================================================
-- expense-tracker — transactions table
--
-- DO NOT auto-push. Run this manually in Supabase Dashboard → SQL Editor.
--
-- Scope: the `transactions` table (income and expense rows owned by a user),
-- its RLS policies, and the indexes the list/stats screens read through.
-- Assumes supabase-schema.sql has already been run — it reuses the
-- public.set_updated_at() function defined there.
-- =========================================================================

-- 1. Table ----------------------------------------------------------------

create type public.transaction_type as enum ('expense', 'income');

create table public.transactions (
  id           uuid                     primary key default gen_random_uuid(),
  user_id      uuid                     not null references auth.users(id) on delete cascade,
  type         public.transaction_type  not null,
  title        text                     not null,
  amount       numeric(14, 2)           not null,
  occurred_at  date                     not null default current_date,
  receipt_url  text,
  created_at   timestamptz              not null default now(),
  updated_at   timestamptz              not null default now(),

  -- A transaction is a magnitude plus a direction; the sign lives in `type`.
  -- Storing a negative amount here would double-count the direction and make
  -- every SUM() ambiguous.
  constraint transactions_amount_positive check (amount > 0),
  constraint transactions_title_not_blank  check (length(btrim(title)) > 0)
);

comment on table  public.transactions is 'Income and expense entries, one row per transaction, owned by a user.';
comment on column public.transactions.amount is 'Always positive. Direction is carried by `type`, never by the sign.';
comment on column public.transactions.occurred_at is 'The day the money moved — not when the row was created. Backdating is normal.';
comment on column public.transactions.receipt_url is 'Cloudinary URL of the scanned receipt, when one was attached.';

-- 2. Indexes ---------------------------------------------------------------

-- Every screen reads "this user's transactions, newest first".
create index transactions_user_occurred_idx
  on public.transactions (user_id, occurred_at desc, created_at desc);

-- Stats splits the same range by direction.
create index transactions_user_type_idx
  on public.transactions (user_id, type, occurred_at desc);

-- 3. updated_at trigger ----------------------------------------------------

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- 4. Row Level Security ----------------------------------------------------

alter table public.transactions enable row level security;

create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);

-- WITH CHECK on insert stops a client from writing rows onto another user_id.
create policy "transactions_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- Both clauses are required on update: USING gates which rows are visible to
-- the update, WITH CHECK gates what they may become. Without the latter a user
-- could reassign their own row to someone else's user_id.
create policy "transactions_update_own"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions_delete_own"
  on public.transactions for delete
  using (auth.uid() = user_id);
