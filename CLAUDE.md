# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev — expense-tracker, portfolio and dotenv-management ALL bind 3000, so run
# one at a time (docs is 3001). Root package.json defines these shortcuts:
pnpm dev:expense       # expense-tracker  :3000
pnpm dev:portfolio     # portfolio        :3000
pnpm dev:dotenv        # dotenv-management:3000 — runs fetch-env first
pnpm dev:dotenv:next   # same, but SKIPS fetch-env (see below)
pnpm dev:docs          # docs             :3001

pnpm build:expense | build:portfolio | build:dotenv | build:docs

pnpm lint                              # every app/package defines `lint`
pnpm check-types                       # ONLY `docs` defines check-types
pnpm --filter=@workspace/ui type-check # the ui package's script is `type-check`, not `check-types`
pnpm format                            # prettier over **/*.{ts,tsx,md}

pnpm add <pkg> --filter=<app>
```

**`pnpm dev --filter=<app>` does not work.** pnpm forwards `--filter` to Next, which
dies with `unknown option '--filter'`. Use the `dev:*` shortcuts above, or spell it out
as `pnpm exec turbo dev --filter=<app>`.

To run several apps at once, pass explicit ports directly to Next:

```bash
cd apps/expense-tracker   && pnpm exec next dev -H 0.0.0.0    # 3000
cd apps/docs              && pnpm exec next dev --port 3001
cd apps/portfolio         && pnpm exec next dev --port 3002
cd apps/dotenv-management && pnpm exec next dev --port 3003   # skips fetch-env
```

There is **no test suite** in this repo — no test files, no runner config. Do not invent `pnpm test`.

pnpm 9.0.0 is enforced via `packageManager`. Never use npm or yarn.

## Architecture

Turborepo + pnpm workspaces (`apps/*`, `packages/*`). Every app is Next.js 16.2 / React 19.2 / Tailwind v4, with `reactCompiler: true` in `next.config.ts` (except `docs`, which is JS-config and compiler-free).

### Apps

| App | Port | Notes |
|-----|------|-------|
| `expense-tracker` | 3000 | Supabase auth + data, `@base-ui/react`, framer-motion. `dev` binds `-H 0.0.0.0` for LAN/mobile testing. |
| `dotenv-management` | 3000 | The secrets service. Supabase-backed, exposes the API the rest of the monorepo fetches env from. |
| `portfolio` | 3000 | Static showcase, `transpilePackages: ["@workspace/ui"]`. |
| `docs` | 3001 | Minimal; the only app with `check-types`. |

### Packages

- `@workspace/ui` — shadcn/ui + Radix component library. Barrel at `packages/ui/src/index.ts`; subpath exports for `./components/*`, `./hooks/*`, `./lib/*`, `./styles/globals.css`. Consumed via `workspace:*`.
- `@repo/eslint-config` — exports `./base`, `./next-js`, `./react-internal`.
- `@repo/typescript-config` — `base.json`, `nextjs.json`, `react-library.json`.
- `@workspace/dotenv-fetch` — standalone helper, built with `tsc` to `dist/`. **Currently unused**: no app depends on it. `dotenv-management` has its own copy at `scripts/fetch-env.ts`. If you touch env fetching, edit the app script, not this package.

```tsx
import { Button, cn } from "@workspace/ui"                 // barrel (preferred)
import { Button } from "@workspace/ui/components/button"   // direct
import "@workspace/ui/styles/globals.css"                  // in root layout
```

Note: `resizable` is commented out of the ui barrel (`index.ts:31`) — react-resizable-panels v4 API changes. The file still exists at `src/components/resizable.tsx`; re-enabling means porting it to the v4 API.

## The env-var system

This is the least obvious part of the repo. `dotenv-management` is both an app and the monorepo's secrets backend.

- Secrets live in Supabase behind `dotenv-management`'s API (`src/app/api/secrets|groups|export/`), keyed by **group name** and **environment** (`dev` | `test` | `prod`). `POST /api/secrets/fetch` takes `{ groups: string[], environment }` and returns the merged set.
- `DOTENV_API_URL` is declared in root `.env.shared` and whitelisted in `turbo.json` `globalEnv`.
- An app declares what it needs in `.dotenv-config.json` (e.g. expense-tracker asks for `["expense-tracker", "shared"]` @ `dev`).
- **Only `dotenv-management` auto-fetches** — its `dev`/`build` scripts chain `pnpm run fetch-env`. Every other app expects a hand-populated `.env.local`. Declaring `.dotenv-config.json` in an app does *not* wire up fetching.
- `fetch-env` reads `SECRET_GROUP` (default `default`), writes `.env.local`, and **prompts on stdin** on first run when `.env.local` is absent — so `pnpm build:dotenv` will hang in CI without a pre-seeded `.env.local`.

⚠️ **`fetch-env` is currently broken and blocks `pnpm dev:dotenv` entirely.** Because `dev`
is `pnpm run fetch-env && next dev`, a fetch failure means Next never starts. The Supabase
project in `apps/dotenv-management/.env.local` (`zslqegiyzypmqtrzqgki.supabase.co`) no longer
resolves — DNS returns NXDOMAIN, so the deleted-or-paused project fails as `TypeError: fetch
failed`. Until someone points `.env.local` at a live project, use `pnpm dev:dotenv:next`
(wraps the app's own `dev:next` script) to boot the UI without fetching secrets.
Note this is a *different* Supabase project from expense-tracker's, which is healthy.

Resolution order: CLI args → `.dotenv-config.json` → `.env.local` → `.env.shared` → defaults.

`turbo.json` whitelists `NEXT_PUBLIC_*` for every build; `DOTENV_KEY` is additionally allowed only for `dotenv-management#build`.

## Supabase auth pattern

Both Supabase apps follow the `@supabase/ssr` cookie-bridging split — do not mix them up:

- `src/lib/supabase/server.ts` → `createServerClient` over `await cookies()`, async `createClient()`. Use in server components, server actions, route handlers.
- `src/lib/supabase/client.ts` → `createBrowserClient`, sync. Client components only.
- `src/middleware.ts` builds its own client over request/response cookies (it cannot use either helper) to refresh the session and gate routes. In expense-tracker, `PUBLIC_PREFIXES = ["/login", "/register", "/auth/callback"]`; everything else redirects to `/login`, and authed users are bounced off `/login`|`/register`.

Auth env vars are `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Receipt scanning

`/scan` photographs a Mongolian VAT receipt (ebarimt) and reads it with Claude
vision in `src/app/_actions/parse-receipt.ts`, then saves the expense without
asking — unless the read is suspect, in which case the form opens prefilled.

Requires `GEMINI_API_KEY` in `apps/expense-tracker/.env` — a free AI Studio key,
no credit card. **Never give it the `NEXT_PUBLIC_` prefix** — that ships the key
to the browser. Without the key the action returns a plain "not configured" error
and the manual form still works.

Gemini was chosen over the alternatives on two hard constraints: no credit card,
and Mongolian Cyrillic (Ө/ө, Ү/ү — absent from Russian, so "Cyrillic" support is
not enough). Tesseract.js runs free and offline but reads thermal receipt paper at
roughly 60% character accuracy, which corrupts amounts; OCR.space takes no card but
does not list Mongolian; Azure and Google Vision cover Mongolian but require a card.
Browser QR scanning was ruled out on two counts. `BarcodeDetector` has never shipped
on iOS Safari (a ~1MB WASM fallback would be required), and more decisively: the QR's
encoding is not published — `qrData` is an opaque value PosAPI hands the merchant to
print — and **no free public endpoint resolves a QR or ДДТД into receipt contents**.
Those live on the merchant's local PosAPI (`127.0.0.1:7080`), behind OAuth2, or behind
`wlc.ebarimt.mn`, which does not resolve in public DNS. Scanning the QR would yield a
string with nowhere to redeem it.

What *is* free and unauthenticated is taxpayer lookup, wrapped in `src/lib/ebarimt.ts`:
`api.ebarimt.mn/api/info/check/getInfo?tin=<ТТД>` returns a registered name. Gemini reads
the ТТД off the receipt and the result is shown as "Verified · <name>" on the success
toast — never as the transaction title, because the registered name is frequently a
holding company rather than the shop (a UBMART receipt resolves to "Одод"). The lookup
is best-effort: it is cached for a day, times out at 4s, and returns null rather than
failing the scan.

The model is `gemini-3.5-flash`. Note `gemini-2.5-flash` is **closed to new API keys**
(404 with "no longer available to new users"), so an older tutorial's model string
will fail on a freshly issued key — check `GET /v1beta/models` before swapping it.

⚠️ Free-tier requests are used to improve Google's products. Before this handles
other people's receipts, move to the paid tier — Flash pricing is cents per scan
and flips that flag off.

The prompt in that file encodes hard-won receipt rules — НӨАТ/НХАТ are *included*
in the total rather than added to it, `Бэлэн мөнгө`/`Хариулт` describe the payment
rather than the bill, and an item line like `Royal mochi 1*8660 =8660` is one item.
It also self-checks: when the item totals don't reconcile with the total it returns
`confident: false`, which is what makes the UI stop and ask instead of banking a
wrong number. Edit those rules only against real receipts.

Two footguns this codebase has already been bitten by — keep both in mind when
touching auth:

- **Never derive a redirect origin from `new URL(request.url).origin`.** expense-tracker
  runs `next dev -H 0.0.0.0`, so `request.url` carries the *bind* address and users get
  redirected to an unreachable `http://0.0.0.0:3000`. The same breaks behind a proxy in
  production. Use `x-forwarded-host`/`x-forwarded-proto`, then `host` — see
  `resolveOrigin()` in `src/app/auth/callback/route.ts`, mirrored in `signInWithGoogle`.
- **A redirect out of middleware must carry the pending cookies.** `getUser()` may refresh
  the session and write new auth cookies onto the `NextResponse.next()` object; a fresh
  `NextResponse.redirect()` drops them, so the refreshed token never reaches the browser
  and the next request looks signed-out — an infinite bounce back to `/login`. Copy them
  across, as `redirectTo()` in `src/middleware.ts` does.

### Transactions data

Schema lives in `apps/expense-tracker/supabase-transactions.sql` — run it by hand in
the Supabase SQL Editor (as with `supabase-schema.sql`; nothing auto-pushes). It
depends on `set_updated_at()` from that earlier file, so run that one first.

`amount` is always **positive** and direction is carried by the `type` enum — a
signed amount would double-count the direction and make every `SUM()` ambiguous.
`occurred_at` is a `date` (when the money moved), distinct from `created_at`.
RLS scopes every row to `auth.uid()`, so reads in `src/lib/transactions.ts` carry
no `user_id` filter; note this means an unauthenticated caller gets an empty set
rather than an error.

⚠️ **Barrel imports and the client boundary.** `src/lib/transactions.ts` is marked
`server-only`, and `components/home/index.ts` re-exports both server components
(`Transactions`, `TotalBalance`) and client ones. A client component importing from
that barrel drags the server modules into the browser bundle and fails the build with
a `next/headers` error whose stack points at `supabase/server.ts` rather than at the
real culprit. Client components under `components/home/` must import siblings by path
(see `GoalsBudgets.tsx`), never through `./`.

### expense-tracker layout convention

Routes in `src/app/` stay thin and delegate to a screen component in `src/screens/` (`HomePage.tsx`, `ProfilePage.tsx`, …). Route-local components live in colocated `_components/` folders; server actions in `src/app/_actions/*.ts` with `"use server"`. Actions are written for `useActionState` — signature `(prevState, formData)`, returning `{ error: string }` or a success shape rather than throwing.

## Next.js 16 / React 19

Every app's `AGENTS.md` (surfaced via a one-line `CLAUDE.md` that just does `@AGENTS.md`) carries a single rule, and it is the one that matters most here:

> **Read `node_modules/next/dist/docs/` before writing Next.js code.** APIs, conventions, and file structure differ from Next 13/14 and likely from your training data.

Concretely: `cookies()` and `headers()` are async, route params are Promises. Verify React 19 behavior rather than assuming React 18.

Those per-app files contain *only* this rule — they are not app architecture docs. For app specifics read the actual code, plus `apps/dotenv-management/{SETUP,DEPLOYMENT,ENV_MANAGEMENT}.md` and `apps/expense-tracker/AUTH_SETUP.md`.

## Deployment

Root `vercel.json` hard-pins the Vercel build to `pnpm turbo build --filter=dotenv-management`. Deploying any other app means overriding the build command in that Vercel project, not editing this file.

Root `README.md` is unmodified `create-turbo` boilerplate — ignore it.
