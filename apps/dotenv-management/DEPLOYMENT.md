# Dotenv Management - Deployment Guide

## Vercel Deployment

### 1. Environment Variables

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to find these values:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Settings → API
   - Project URL = `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key = `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key = `SUPABASE_SERVICE_ROLE_KEY`

### 2. Deploy Options

#### Option A: Vercel GitHub Integration (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Root Directory:** `apps/dotenv-management`
4. **Framework Preset:** Next.js
5. **Build Command:** `cd ../.. && pnpm turbo build --filter=dotenv-management`
6. **Install Command:** `cd ../.. && pnpm install`
7. Add environment variables (see above)
8. Click Deploy

#### Option B: Vercel CLI

```bash
cd apps/dotenv-management
vercel --prod

# Follow prompts:
# - Set Root Directory: apps/dotenv-management
# - Build Command: cd ../.. && pnpm turbo build --filter=dotenv-management
# - Install Command: cd ../.. && pnpm install
```

### 3. Post-Deployment

After successful deployment:

1. Copy your deployment URL (e.g., `https://dotenv-management.vercel.app`)
2. Update monorepo `.env.shared`:
   ```bash
   DOTENV_API_URL=https://dotenv-management.vercel.app
   ```
3. Commit and push:
   ```bash
   git add .env.shared
   git commit -m "Update DOTENV_API_URL"
   git push
   ```

## Database Setup

Make sure your Supabase database has the required tables. Run this SQL:

```sql
-- See supabase-schema.sql for full schema
```

## Testing the Deployment

1. Visit your deployment URL
2. Sign up for an account
3. Create a secret group
4. Add some secrets
5. Test the API:
   ```bash
   curl -X POST https://your-url.vercel.app/api/secrets/fetch \
     -H "Content-Type: application/json" \
     -d '{"groups": ["default"], "environment": "dev"}'
   ```

## Troubleshooting

### 500 Error on Deployment

**Problem:** Middleware fails due to missing environment variables

**Solution:** Make sure all environment variables are set in Vercel dashboard

### Build Fails

**Problem:** TypeScript errors or missing dependencies

**Solution:**
1. Run `pnpm build --filter=dotenv-management` locally
2. Fix any errors
3. Commit and push

### API Returns Empty Secrets

**Problem:** No secrets found in database

**Solution:**
1. Visit `/dotenv` page
2. Create a secret group
3. Add secrets to the group
