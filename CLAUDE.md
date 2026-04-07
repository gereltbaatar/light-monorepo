# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

```bash
# Development (from monorepo root)
pnpm dev                          # Run all apps
pnpm dev --filter=portfolio       # Run single app
pnpm dev --filter=docs            # Docs runs on port 3001

# Build & Quality
pnpm build                        # Build all
pnpm build --filter=expense-tracker
pnpm lint                         # Lint all
pnpm check-types                  # Type check all
pnpm format                       # Prettier format

# Package management (pnpm only - required)
pnpm install                      # Install deps
pnpm add <pkg> --filter=portfolio # Add to specific app
```

## Architecture

### Monorepo Structure
- **Package Manager:** pnpm 9.0.0 (enforced via `packageManager` field)
- **Build System:** Turborepo with task caching
- **Node:** >=18 required

### Apps (`apps/`)
| App | Port | Purpose |
|-----|------|---------|
| `portfolio` | 3000 | Portfolio showcase |
| `expense-tracker` | 3000 | Expense tracking |
| `dotenv-management` | 3000 | Environment variable management |
| `docs` | 3001 | Documentation |

All apps use Next.js 16 with React 19.

### Shared Packages (`packages/`)
| Package | Import As | Purpose |
|---------|-----------|---------|
| `ui` | `@workspace/ui` | shadcn/ui component library (45+ components) |
| `eslint-config` | `@repo/eslint-config` | Shared ESLint configs |
| `typescript-config` | `@repo/typescript-config` | Shared tsconfig bases |

### UI Package Usage
```tsx
// Import from barrel export
import { Button, Card, cn } from "@workspace/ui"

// Or import specific component
import { Button } from "@workspace/ui/components/button"

// Global styles (import in app layout)
import "@workspace/ui/styles/globals.css"
```

Key utilities:
- `cn()` - Combines clsx + tailwind-merge for className handling
- Components use Radix UI primitives + CVA for variants

## Tech Stack
- **Framework:** Next.js 16.2.x
- **React:** 19.2.x
- **Styling:** Tailwind CSS v4, tailwind-animate
- **Forms:** react-hook-form + Zod validation
- **Icons:** lucide-react
- **Charts:** Recharts
- **Dark Mode:** next-themes with `class` strategy

## Important Notes

### Next.js 16 Breaking Changes
Before writing Next.js code, check `node_modules/next/dist/docs/` for current API documentation. Many APIs and conventions have changed from earlier versions.

### TypeScript
- Strict mode enabled across all packages
- Path alias `@/*` maps to app's src directory
- `noUncheckedIndexedAccess: true` - always handle potential undefined from array/object access

### Turborepo Caching
- Build outputs cached in `.next/**` and `dist/**`
- Use `--filter` to run tasks for specific apps
- Dev task runs in persistent mode (no caching)
