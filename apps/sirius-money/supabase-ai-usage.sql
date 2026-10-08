-- expense-tracker — AI token usage per receipt scan
-- Run manually in Supabase Dashboard → SQL Editor. Safe to re-run.

create table if not exists public.ex_ai_usage (
  id               uuid           primary key default gen_random_uuid(),
  user_id          uuid           not null references auth.users(id) on delete cascade,
  model            text           not null,
  input_tokens     integer        not null default 0,
  output_tokens    integer        not null default 0,
  thinking_tokens  integer        not null default 0,
  -- Priced at paid-tier rates when recorded, so later price changes don't rewrite history.
  cost_usd         numeric(12, 6) not null default 0,
  created_at       timestamptz    not null default now()
);

comment on table public.ex_ai_usage is 'One row per Gemini call (receipt scan, voice entry, advisor).';

create index if not exists ai_usage_user_created_idx
  on public.ex_ai_usage (user_id, created_at desc);

alter table public.ex_ai_usage enable row level security;

drop policy if exists "ai_usage_select_own" on public.ex_ai_usage;
create policy "ai_usage_select_own" on public.ex_ai_usage
  for select using (auth.uid() = user_id);

drop policy if exists "ai_usage_insert_own" on public.ex_ai_usage;
create policy "ai_usage_insert_own" on public.ex_ai_usage
  for insert with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
