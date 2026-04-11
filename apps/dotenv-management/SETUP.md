# Dotenv Management - Setup Guide

## Overview

A complete secrets management system with Supabase backend for storing and managing environment variables across multiple environments (dev, test, prod).

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Node.js**: >= 18
3. **pnpm**: 9.0.0 (required by monorepo)

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Set project name (e.g., "dotenv-management")
4. Set a strong database password
5. Choose a region close to you
6. Wait for project to be created (~2 minutes)

## Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the following SQL:

```sql
-- Create secret_groups table
CREATE TABLE secret_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE secret_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for secret_groups
CREATE POLICY "Users can view their own secret groups"
  ON secret_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own secret groups"
  ON secret_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own secret groups"
  ON secret_groups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own secret groups"
  ON secret_groups FOR DELETE
  USING (auth.uid() = user_id);

-- Create secrets table
CREATE TABLE secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES secret_groups(id) ON DELETE CASCADE,
  environment TEXT NOT NULL CHECK (environment IN ('dev', 'test', 'prod')),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, environment, key)
);

-- Enable Row Level Security
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for secrets
CREATE POLICY "Users can view secrets from their groups"
  ON secrets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM secret_groups
      WHERE secret_groups.id = secrets.group_id
      AND secret_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert secrets to their groups"
  ON secrets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM secret_groups
      WHERE secret_groups.id = secrets.group_id
      AND secret_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update secrets in their groups"
  ON secrets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM secret_groups
      WHERE secret_groups.id = secrets.group_id
      AND secret_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete secrets from their groups"
  ON secrets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM secret_groups
      WHERE secret_groups.id = secrets.group_id
      AND secret_groups.user_id = auth.uid()
    )
  );
```

4. Click **Run** to execute the SQL
5. Verify tables were created in the **Table Editor**

## Step 3: Configure Environment Variables

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy your **Project URL** and **anon public** key
3. Create `.env.local` file in `apps/dotenv-management/`:

```bash
# Copy from .env.example
cp apps/dotenv-management/.env.example apps/dotenv-management/.env.local
```

4. Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Required for builds (per CLAUDE.md)
DOTENV_KEY=your-dotenv-key-here
```

**Note**: The service role key is optional for now, but required for admin features later.

## Step 4: Enable Email Authentication (Optional)

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Email** provider (should be on by default)
3. Configure email templates if desired
4. For development, you can disable email confirmation:
   - Go to **Authentication** > **URL Configuration**
   - Set **Site URL** to `http://localhost:3000`

## Step 5: Run the Application

```bash
# From monorepo root
pnpm dev --filter=dotenv-management
```

Application will be available at: `http://localhost:3000`

## Step 6: Test the Application

### 1. Sign Up
- Navigate to `http://localhost:3000/signup`
- Create a new account
- Check your email for confirmation (if enabled)

### 2. Sign In
- Navigate to `http://localhost:3000/signin`
- Sign in with your credentials

### 3. Create Secret Group
- Click **Manage Secrets** in sidebar
- Click **Create Group**
- Enter group name (e.g., "my-app")
- Add description (optional)

### 4. Add Secrets
- Click **View Secrets** on a group
- Click **Add Secret**
- Switch between Dev/Test/Prod tabs
- Add key-value pairs (e.g., `API_KEY=abc123`)

### 5. Export .env File
- Click **Export .env** button
- File downloads as `.env.dev` (or test/prod)
- Use in your projects!

## Features

✅ **Authentication**: Supabase Auth with email/password
✅ **Row Level Security**: Users can only see their own secrets
✅ **Multi-Environment**: Dev, Test, and Production environments
✅ **Secret Groups**: Organize secrets by project
✅ **Export .env**: Download environment variables as `.env` files
✅ **Secure**: All secrets stored in Supabase with encryption

## Troubleshooting

### "Unauthorized" errors
- Make sure you're signed in
- Check that `.env.local` has correct Supabase credentials
- Verify RLS policies are enabled

### Tables not found
- Run the SQL schema creation script again
- Check that tables exist in **Table Editor**

### Sign up not working
- Check email confirmation settings
- Look at browser console for errors
- Verify Supabase URL and anon key are correct

### Secrets not saving
- Verify RLS policies are correctly set up
- Check that the group_id exists
- Look at browser Network tab for API errors

## Database Schema

```
secret_groups
├─ id (UUID, primary key)
├─ user_id (UUID, foreign key to auth.users)
├─ group_name (TEXT, unique)
├─ description (TEXT, optional)
├─ created_at (TIMESTAMPTZ)
└─ updated_at (TIMESTAMPTZ)

secrets
├─ id (UUID, primary key)
├─ group_id (UUID, foreign key to secret_groups)
├─ environment (TEXT, 'dev'|'test'|'prod')
├─ key (TEXT)
├─ value (TEXT)
├─ created_at (TIMESTAMPTZ)
└─ updated_at (TIMESTAMPTZ)
```

## Security Best Practices

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Use strong passwords** for Supabase and user accounts
3. **Enable MFA** in Supabase dashboard for production
4. **Rotate secrets regularly** using the edit feature
5. **Use service role key carefully** - Never expose on client side

## Future Enhancements

- [ ] CLI tool to fetch secrets
- [ ] Team sharing (multi-user access to groups)
- [ ] Secret history/versioning
- [ ] Bulk import from existing `.env` files
- [ ] Secret rotation reminders
- [ ] Access logs and audit trail

## Support

For issues or questions:
- Check Supabase logs in dashboard
- Review browser console for errors
- Verify all environment variables are set
- Ensure database schema is correct

---

**Танд амжилт хүсье!** (Good luck!)
