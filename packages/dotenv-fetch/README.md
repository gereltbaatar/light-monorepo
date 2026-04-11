# @workspace/dotenv-fetch

Fetch environment variables from dotenv-management API and write to `.env` file.

## Setup

### Option 1: Monorepo-wide configuration (Recommended)

1. Add `DOTENV_API_URL` to root `.env.shared`:

```bash
# .env.shared (at monorepo root)
DOTENV_API_URL=https://your-dotenv-app.vercel.app
```

2. Create `.dotenv-config.json` in your app directory:

```json
{
  "groups": ["expense-tracker", "shared"],
  "environment": "dev"
}
```

### Option 2: App-specific configuration

Add to your app's `.env.local`:

```bash
# apps/your-app/.env.local
DOTENV_API_URL=https://your-dotenv-app.vercel.app
SECRET_GROUP=your-app
```

2. Add to your app's `package.json`:

```json
{
  "scripts": {
    "dev": "pnpm run fetch-env && next dev",
    "dev:next": "next dev",
    "build": "pnpm run fetch-env && next build",
    "fetch-env": "tsx ../../packages/dotenv-fetch/src/fetch-env.ts"
  }
}
```

## Usage

### Single group
```bash
pnpm fetch-env --group=backend --env=dev
```

### Multiple groups (like Pinecone)
```bash
pnpm fetch-env --groups=backend,frontend,shared --env=prod
```

### Using defaults from .env.local
```bash
pnpm fetch-env  # Uses SECRET_GROUP and NODE_ENV from .env.local
```

## How it works

1. Reads `DOTENV_API_URL` from `.env.local`
2. Fetches secrets from dotenv-management API
3. Merges secrets from multiple groups
4. Writes to `.env` file in your project root

## Environment Variables

- `DOTENV_API_URL` - URL of your deployed dotenv-management app (required)
- `SECRET_GROUP` - Default group name (default: "default")
- `NODE_ENV` - Default environment (default: "dev")
