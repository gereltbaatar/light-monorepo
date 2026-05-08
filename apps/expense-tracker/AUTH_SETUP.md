# Auth Setup — expense-tracker

This app uses **Supabase Auth** as the system of record. Users can sign in two ways:

1. **Email + password** — handled natively by Supabase Auth.
2. **"Continue with Google"** — handled via Supabase's native Google OAuth provider.

All users live in a single `auth.users` table regardless of how they signed in.

## 1. Local environment

Create `apps/expense-tracker/.env.local` (note: `.env.local`, not `.env` — the `.env` file is committed to git, secrets must live in `.env.local`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
```

Both legacy `anon` keys (`eyJhbGc...`) and new `sb_publishable_...` keys work — the env var name stays the same.

## 2. Supabase project

1. Create a project at https://supabase.com. Copy the URL and `anon` (or publishable) key into `.env.local`.
2. **Authentication → Providers → Email**: turn **"Confirm email" OFF**. (Users sign in immediately on sign-up.)
3. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` for local dev (set production URL when deploying).
   - Redirect URLs: add `http://localhost:3000/auth/callback` (and the production equivalent).

## 3. Google OAuth

### Google Cloud Console

1. Go to https://console.cloud.google.com → create or pick a project.
2. **APIs & Services → OAuth consent screen**: configure (External user type, app name, support email).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized redirect URIs**: add the Supabase callback (not this app's callback):
     ```
     https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
     ```
4. Save. Copy the **Client ID** and **Client Secret**.

### Supabase Dashboard

1. **Authentication → Providers → Google**: enable.
2. Paste the Client ID and Client Secret from Google Cloud Console.
3. Save.

## 4. Run

```bash
pnpm dev --filter=expense-tracker
```

Visit http://localhost:3000 — middleware will redirect to `/login`. Sign up via email or click "Continue with Google".

## How the pieces connect

- `src/lib/supabase/{client,server}.ts` — Supabase clients for browser and server contexts.
- `src/middleware.ts` — refreshes the Supabase session cookie on every request and redirects unauthenticated users to `/login`.
- `src/app/_actions/auth.ts` — server actions: `signInWithEmail`, `signUpWithEmail`, `signInWithGoogle`, `signOut`.
- `src/app/auth/callback/route.ts` — exchanges the OAuth `code` for a session cookie when Google redirects back (via Supabase).

## Adding more OAuth providers later

Enable the provider in Supabase Dashboard (GitHub, Apple, etc.), then in code call `signInWithOAuth({ provider: 'github' })` from a new server action. The callback route already handles the code exchange for any provider.
