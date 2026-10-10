-- Sirius AI: one set of AI settings shared by every app, kept on the profile.
-- Run by hand in the Supabase SQL Editor after 000_core.sql; safe to re-run.
-- Usage is recorded in sirius-money's ex_ai_usage (supabase-ai-usage.sql), which every app writes to.

alter table public.profiles
  add column if not exists ai_settings jsonb not null default '{}'::jsonb;

comment on column public.profiles.ai_settings is
  '{ features: { advisor, voice, receipt }, orb: { orb, colorFrom, colorTo, speed, size, mic } }. Missing keys mean defaults.';

notify pgrst, 'reload schema';
