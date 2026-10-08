-- =========================================================================
-- expense-tracker — profiles table
--
-- DO NOT auto-push. Run this manually in Supabase Dashboard → SQL Editor.
--
-- Scope: only the `profiles` table (1:1 with auth.users) plus the trigger
-- that creates a profile row on signup. Other tables (accounts, transactions,
-- goals, budgets, categories) come later.
-- =========================================================================

-- 1. Table ----------------------------------------------------------------

create type public.user_role as enum ('user', 'admin');

create table public.profiles (
  id                    uuid             primary key references auth.users(id) on delete cascade,
  email                 text             not null,
  display_name          text,
  avatar_url            text,
  role                  public.user_role not null default 'user',
  notifications_paused  boolean          not null default false,
  last_login_at         timestamptz,
  created_at            timestamptz      not null default now(),
  updated_at            timestamptz      not null default now()
);

comment on table  public.profiles is 'Per-user profile mirroring auth.users with app-specific fields.';
comment on column public.profiles.id is 'Same UUID as auth.users.id.';
comment on column public.profiles.role is 'Authorization role. Always defaults to ''user''; promote to ''admin'' manually via Supabase Dashboard.';
comment on column public.profiles.notifications_paused is 'Push-notification mute toggle. UI-only prefs (language, dark_mode) live in localStorage, not here.';

-- 2. updated_at trigger ----------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 3. Auto-create profile on auth.users insert ------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name'
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Row Level Security ----------------------------------------------------

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Block clients from changing their own role. The service role bypasses this
-- so admin promotion still works from the Supabase Dashboard / SQL editor.
create or replace function public.prevent_role_self_change()
returns trigger
language plpgsql
as $$
begin
  if current_setting('request.jwt.claim.role', true) = 'service_role' then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'role cannot be changed by the user';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_self_change
  before update on public.profiles
  for each row execute function public.prevent_role_self_change();

-- INSERT is handled by the handle_new_user trigger (security definer), so no
-- insert policy is needed for normal app use.
-- DELETE is handled by `on delete cascade` from auth.users; we do not allow
-- direct profile deletion from the client.
