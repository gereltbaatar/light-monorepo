# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

```bash
# Development (from monorepo root)
pnpm dev                          # Run all apps in parallel
pnpm dev --filter=portfolio       # Run single app (port 3000)
pnpm dev --filter=expense-tracker # Run single app (port 3000)
pnpm dev --filter=docs            # Run docs (port 3001)

# Build & Quality
pnpm build                        # Build all packages and apps
pnpm build --filter=expense-tracker
pnpm lint                         # Lint all packages
pnpm check-types                  # Type check (docs only via check-types)
pnpm format                       # Format with Prettier

# Package Management (pnpm 9.0.0 required)
pnpm install                      # Install all dependencies
pnpm add <pkg> --filter=<app>     # Add to specific app/package
```

## Architecture

### Monorepo Structure
- **Package Manager:** pnpm 9.0.0 (enforced via `packageManager` field - do not use npm/yarn)
- **Build System:** Turborepo with intelligent task caching and dependency graphs
- **Node:** >=18 required
- **TypeScript:** 5.9.2 (strict mode enabled)

### Apps (`apps/`)
| App | Port | Purpose | Special Config |
|-----|------|---------|---------------|
| `portfolio` | 3000 | Portfolio showcase | React Compiler enabled |
| `expense-tracker` | 3000 | Expense tracking app | Uses @base-ui/react, framer-motion |
| `dotenv-management` | 3000 | Env var management | DOTENV_KEY env required for build |
| `docs` | 3001 | Documentation | Has check-types script |

All apps use:
- Next.js 16.2.x with React 19.2.x
- Tailwind CSS v4 with @tailwindcss/postcss
- babel-plugin-react-compiler for optimizations
- TypeScript in strict mode

### Shared Packages (`packages/`)
| Package | Import As | Purpose |
|---------|-----------|---------|
| `dotenv-fetch` | `@workspace/dotenv-fetch` | Fetch env vars from dotenv-management API |
| `ui` | `@workspace/ui` | shadcn/ui component library (46 components) |
| `eslint-config` | `@repo/eslint-config` | Shared ESLint configurations |
| `typescript-config` | `@repo/typescript-config` | Shared TypeScript configs |

### UI Package Details
The `@workspace/ui` package is a comprehensive shadcn/ui component library built on Radix UI primitives.

**Import patterns:**
```tsx
// Barrel export (recommended)
import { Button, Card, Input, cn } from "@workspace/ui"

// Direct component import
import { Button } from "@workspace/ui/components/button"

// Hooks
import { useMobile } from "@workspace/ui/hooks/use-mobile"

// Utilities
import { cn } from "@workspace/ui/lib/utils"

// Global styles (import in root layout)
import "@workspace/ui/styles/globals.css"
```

**Key components available:**
- Form controls: Button, Input, Textarea, Checkbox, Switch, Select, RadioGroup, Slider
- Layout: Card, Separator, Tabs, Sheet, Dialog, Drawer, Sidebar
- Data display: Table, Badge, Avatar, Calendar, Chart (Recharts)
- Navigation: NavigationMenu, Menubar, Breadcrumb, Pagination
- Feedback: Alert, AlertDialog, Toast (Sonner), Progress, Skeleton
- Overlays: Popover, Tooltip, HoverCard, ContextMenu, DropdownMenu
- Advanced: Command, Carousel, Collapsible, Accordion

**Key utilities:**
- `cn()` - Combines clsx + tailwind-merge for className handling
- `useMobile()` - Hook for responsive breakpoint detection
- Components use CVA (class-variance-authority) for variant management

**Known issues:**
- Resizable component temporarily disabled due to react-resizable-panels v4 API changes

## Tech Stack

### Core Technologies
- **Framework:** Next.js 16.2.x (check `node_modules/next/dist/docs/` for current API docs)
- **React:** 19.2.x with React Compiler optimizations
- **TypeScript:** 5.9.2 (strict mode, target: ES2017)
- **Styling:** Tailwind CSS v4, tailwind-animate, tailwindcss-animate

### Key Libraries
- **Forms:** react-hook-form + @hookform/resolvers + Zod v4.3.6 validation
- **UI Primitives:** Radix UI suite (20+ primitives)
- **Icons:** lucide-react
- **Charts:** Recharts
- **Animations:** framer-motion (expense-tracker), tw-animate-css
- **Date handling:** date-fns, react-day-picker
- **Theming:** next-themes (class strategy for dark mode)
- **Carousel:** embla-carousel-react
- **Toast:** Sonner
- **Command palette:** cmdk

### TypeScript Configuration
- **Strict mode:** Enabled across all packages
- **Path aliases:**
  - `@/*` → app's `src/` directory
  - `@workspace/ui` → `packages/ui/src/index.ts`
  - `@workspace/ui/*` → `packages/ui/src/*`
- **Module resolution:** bundler
- **JSX:** react-jsx
- **Target:** ES2017
- All index access is unchecked - handle potential undefined

### Turborepo Task Pipeline
**Build tasks:**
- `build` - Standard build with `.next/**`, `dist/**` outputs (cache enabled)
- App-specific builds have isolated env var access (NEXT_PUBLIC_*, DOTENV_KEY for dotenv-management)
- Build tasks depend on `^build` (dependencies build first)

**Dev tasks:**
- Run in persistent mode with caching disabled
- Multiple apps can run simultaneously (use different ports)

**Lint/Type-check tasks:**
- Cascade through dependencies with `^lint`, `^check-types`
- `check-types` available in docs app via `next typegen && tsc --noEmit`

## Development Workflow

### Working with Apps
```bash
# Run specific app
cd apps/expense-tracker && pnpm dev

# Or from root with filter
pnpm dev --filter=expense-tracker

# Build specific app
pnpm build --filter=portfolio

# Add dependency to app
pnpm add lucide-react --filter=expense-tracker
```

### Working with UI Package
```bash
# Type check ui package
cd packages/ui && pnpm type-check

# Lint ui package
cd packages/ui && pnpm lint

# Use in apps via workspace protocol
# In app package.json: "@workspace/ui": "workspace:*"
```

### Turborepo Filters
```bash
# Run for specific package
pnpm build --filter=docs

# Run for all apps
pnpm build --filter=./apps/*

# Run for package and dependents
pnpm build --filter=...@workspace/ui
```

## Important Notes

### Next.js 16 Breaking Changes
Before writing Next.js code, **check `node_modules/next/dist/docs/`** for current API documentation. Many APIs, conventions, and defaults have changed from earlier versions. Do not rely on documentation for Next.js 13/14.

### React 19 Changes
- React 19 is in use across all apps
- Some APIs may differ from React 18 - verify current behavior
- React Compiler is enabled via babel-plugin-react-compiler

### Package Manager Constraints
- **Only pnpm 9.0.0 is supported** - enforced via packageManager field
- Do not use npm or yarn commands
- Workspace protocol (`workspace:*`) used for internal dependencies

### Environment Variables

**Centralized Secrets Management:**
- All apps fetch secrets from `dotenv-management` API
- Root-level `.env.shared` contains `DOTENV_API_URL`
- Each app has `.dotenv-config.json` specifying which secret groups to fetch
- Secrets automatically fetched before `dev` and `build` commands

**Configuration Priority:**
1. CLI arguments (highest)
2. `.dotenv-config.json` (app-specific groups/env)
3. `.env.local` (project-level overrides)
4. `.env.shared` (monorepo-wide config)
5. Default values (lowest)

**Example `.dotenv-config.json`:**
```json
{
  "groups": ["expense-tracker", "shared"],
  "environment": "dev"
}
```

**Most apps use:**
- `NEXT_PUBLIC_*` prefix for client-side env vars
- `dotenv-management` requires `DOTENV_KEY` for builds
- Turborepo tracks `.env*`, `.env.shared` as global dependencies

### Caching Behavior
- Build outputs cached in `.next/**` and `dist/**`
- Dev tasks run in persistent mode (no caching)
- Use `--force` to ignore cache if needed
- Global dependencies: `tsconfig.json`, `.env*` files
