# Environment Variables Management

Энэ app нь Supabase-аас автоматаар .env файл татдаг систем ашигладаг.

## Ажиллах зарчим

```
┌─────────────────────────────────────────────────────────────┐
│  pnpm dev (эсвэл npm run dev)                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  predev hook ажиллана                                        │
│  → npm run fetch-env --group=<group> --env=dev              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  scripts/fetch-env.ts ажиллана                              │
│  1. Supabase-д холбогдоно                                   │
│  2. Secret group олно (group_name-ээр)                      │
│  3. Secrets татна (environment-ээр шүүнэ)                   │
│  4. .env файл үүсгэнэ                                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  .env файл бэлэн болно                                      │
│  → Next.js app эхэлнэ                                       │
└─────────────────────────────────────────────────────────────┘
```

## Анхны тохиргоо

### 1. .env файл үүсгэх

```bash
cp .env.example .env.local
```

### 2. Supabase credentials оруулах

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Secret group тохируулах

```env
SECRET_GROUP=my-app
NODE_ENV=development
```

## Database Schema

Supabase дээр дараах tables шаардлагатай:

### `secret_groups` table

```sql
CREATE TABLE secret_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, group_name)
);
```

### `secrets` table

```sql
CREATE TABLE secrets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES secret_groups(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('dev', 'test', 'prod')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, key, environment)
);
```

## Хэрэглээ

### Development режимд ажиллуулах

```bash
# Автоматаар .env татна
pnpm dev
```

### Тусгай group-ээр ажиллуулах

```bash
# SECRET_GROUP env variable тохируулах
SECRET_GROUP=my-custom-group pnpm dev
```

### Өөр environment-р ажиллуулах

```bash
# Production secrets татах
NODE_ENV=production pnpm build
```

### Зөвхөн .env файл татах

```bash
# Default group, dev environment
pnpm run fetch-env

# Тусгай group болон environment
pnpm run fetch-env --group=my-app --env=prod
```

## Жишээ өгөгдөл

### Secret Group үүсгэх

```sql
INSERT INTO secret_groups (user_id, group_name, description)
VALUES (
  'user-uuid',
  'my-app',
  'My Application Secrets'
);
```

### Secrets нэмэх

```sql
-- Development secrets
INSERT INTO secrets (group_id, key, value, environment) VALUES
  ('group-uuid', 'DATABASE_URL', 'postgresql://localhost:5432/dev', 'dev'),
  ('group-uuid', 'API_KEY', 'dev-api-key-123', 'dev'),
  ('group-uuid', 'NEXT_PUBLIC_APP_URL', 'http://localhost:3000', 'dev');

-- Production secrets
INSERT INTO secrets (group_id, key, value, environment) VALUES
  ('group-uuid', 'DATABASE_URL', 'postgresql://prod-server:5432/prod', 'prod'),
  ('group-uuid', 'API_KEY', 'prod-api-key-xyz', 'prod'),
  ('group-uuid', 'NEXT_PUBLIC_APP_URL', 'https://myapp.com', 'prod');
```

## Анхааруулга

- ⚠️ `.env` файлуудыг git-д commit хийхгүй байх
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY`-г хамгаалалттай байлгах
- ⚠️ Production secrets-т зөвхөн эрх бүхий хүмүүс хандах
- ✅ `.env.local`-ийг local development-д ашиглах
- ✅ `.env.example`-ийг git-д хадгалах

## Алдаа засах

### "Group not found" алдаа

```bash
# SECRET_GROUP зөв тохируулсан эсэхээ шалгах
echo $SECRET_GROUP

# Эсвэл group name шууд дамжуулах
pnpm run fetch-env --group=your-actual-group-name
```

### "Missing Supabase credentials"

```bash
# .env.local файл байгаа эсэхийг шалгах
cat .env.local

# Supabase credentials зөв эсэхийг шалгах
```

## Scripts тайлбар

| Script | Тайлбар |
|--------|---------|
| `pnpm dev` | Development server эхлүүлэх (автоматаар .env татна) |
| `pnpm build` | Production build (автоматаар production .env татна) |
| `pnpm run fetch-env` | Зөвхөн .env файл татах |
| `predev` | `pnpm dev`-ээс өмнө ажиллах hook |
| `prebuild` | `pnpm build`-ээс өмнө ажиллах hook |
