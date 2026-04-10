# Setting Up shadcn/ui in a Turborepo Monorepo

This guide explains how to set up shadcn/ui as a shared package in a Turborepo monorepo, allowing multiple Next.js apps to use a centralized component library.

## Architecture Overview

```
monorepo/
├── apps/
│   ├── app-1/          # Next.js app consuming ui package
│   ├── app-2/          # Another Next.js app consuming ui package
│   └── docs/           # Documentation app
├── packages/
│   └── ui/             # Shared shadcn/ui component library
│       ├── src/
│       │   ├── components/    # shadcn components
│       │   ├── hooks/         # Custom hooks
│       │   ├── lib/           # Utilities (cn function)
│       │   ├── styles/        # Global CSS
│       │   └── index.ts       # Barrel exports
│       ├── package.json
│       └── tsconfig.json
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Step 1: Create the UI Package

### 1.1 Initialize the Package

```bash
cd packages
mkdir ui && cd ui
pnpm init
```

### 1.2 Configure `package.json`

```json
{
  "name": "@workspace/ui",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./components/*": "./src/components/*.tsx",
    "./hooks/*": "./src/hooks/*.ts",
    "./lib/*": "./src/lib/*.ts",
    "./styles/globals.css": "./src/styles/globals.css"
  },
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@radix-ui/react-slot": "^1.2.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "tailwindcss-animate": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "^19.2.2",
    "@types/react-dom": "^19",
    "tailwindcss": "latest",
    "typescript": "latest"
  },
  "peerDependencies": {
    "react": "^18 || ^19",
    "react-dom": "^18 || ^19"
  }
}
```

Key points:
- Use `@workspace/ui` as the package name (matches workspace protocol)
- Export multiple entry points for components, hooks, lib, and styles
- Add only essential dependencies (more added as you install components)
- React and React DOM are peer dependencies (provided by consuming apps)

### 1.3 Create Directory Structure

```bash
mkdir -p src/{components,hooks,lib,styles}
```

### 1.4 Create `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 1.5 Create `src/styles/globals.css`

```css
@import "tailwindcss";
@import "tailwindcss-animate";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 1.6 Create `src/index.ts` (Barrel Export)

```typescript
// Start with utils, add component exports as you install them
export { cn } from "./lib/utils"
```

### 1.7 Create `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### 1.8 Create `tailwind.config.ts` (Optional)

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

## Step 2: Install shadcn/ui Components

You have two options:

### Option A: Manual Installation (Recommended for Turborepo)

1. Copy component files from [shadcn/ui](https://ui.shadcn.com/) directly into `packages/ui/src/components/`
2. Install required dependencies for each component
3. Export from `src/index.ts`

Example for Button component:

```bash
cd packages/ui
pnpm add @radix-ui/react-slot
```

Create `src/components/button.tsx`:
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

Update `src/index.ts`:
```typescript
export { cn } from "./lib/utils"
export * from "./components/button"
```

### Option B: Use shadcn CLI with Custom Configuration

Create `components.json` in `packages/ui/`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "./src/components",
    "utils": "./src/lib/utils",
    "ui": "./src/components",
    "lib": "./src/lib",
    "hooks": "./src/hooks"
  }
}
```

Then run:
```bash
cd packages/ui
npx shadcn@latest add button
```

**Important:** After installation, manually export components from `src/index.ts`.

## Step 3: Configure Apps to Use the UI Package

### 3.1 Add Dependency

In each app's `package.json`:

```json
{
  "dependencies": {
    "@workspace/ui": "workspace:*",
    "next": "16.2.2",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  }
}
```

Then run:
```bash
pnpm install
```

### 3.2 Configure TypeScript

In app's `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@workspace/ui": ["../../packages/ui/src/index.ts"],
      "@workspace/ui/*": ["../../packages/ui/src/*"],
      "@/*": ["./src/*"]
    }
  }
}
```

### 3.3 Import Global Styles

In app's root layout (`src/app/layout.tsx`):

```typescript
import "@workspace/ui/styles/globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My App",
  description: "App using shared UI",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### 3.4 Configure Tailwind

In app's `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    // Include UI package components in content scanning
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Import same theme extensions as UI package
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ... rest of colors
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

### 3.5 Use Components

```typescript
import { Button } from "@workspace/ui"

export default function Page() {
  return (
    <div>
      <Button>Click me</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Delete</Button>
    </div>
  )
}
```

## Step 4: Configure Turborepo

Update `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    }
  }
}
```

Key points:
- `^build` means build dependencies first (UI package before apps)
- Dev mode has no caching and runs persistently
- Lint and type-check cascade through dependencies

## Step 5: Workflow for Adding New Components

1. **Add component to UI package:**
   ```bash
   cd packages/ui
   # Option A: Manual copy from shadcn docs
   # Option B: npx shadcn@latest add <component-name>
   ```

2. **Install required dependencies:**
   ```bash
   pnpm add @radix-ui/react-dialog  # for Dialog component
   ```

3. **Export from `src/index.ts`:**
   ```typescript
   export * from "./components/button"
   export * from "./components/dialog"
   export * from "./components/card"
   ```

4. **Use in apps immediately:**
   ```typescript
   import { Button, Dialog, Card } from "@workspace/ui"
   ```

## Common Patterns

### Pattern 1: Direct Component Import
```typescript
import { Button } from "@workspace/ui/components/button"
```

### Pattern 2: Barrel Export Import
```typescript
import { Button, Card, Input } from "@workspace/ui"
```

### Pattern 3: Hooks Import
```typescript
import { useMobile } from "@workspace/ui/hooks/use-mobile"
```

### Pattern 4: Utility Import
```typescript
import { cn } from "@workspace/ui/lib/utils"
```

## Troubleshooting

### Issue: "Module not found: @workspace/ui"

**Solution:** Ensure pnpm workspace is configured properly.

Check `pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Run:
```bash
pnpm install
```

### Issue: Tailwind styles not applied

**Solution:**
1. Ensure global CSS is imported in root layout
2. Check that `content` in Tailwind config includes UI package path
3. Restart dev server after Tailwind config changes

### Issue: Type errors with React

**Solution:** Ensure React versions match between UI package and apps.

In UI package `package.json`:
```json
{
  "peerDependencies": {
    "react": "^18 || ^19",
    "react-dom": "^18 || ^19"
  }
}
```

### Issue: Hot reload not working for UI package changes

**Solution:** This is expected behavior with Turborepo. To enable hot reload:

1. Run UI package in watch mode (if you add build step)
2. Or restart app dev server after UI package changes

## Best Practices

1. **Keep UI package dependency-light:** Only add dependencies when components need them
2. **Use barrel exports:** Export all components from `src/index.ts` for clean imports
3. **Version control:** All components should be in version control
4. **Documentation:** Document custom hooks and utilities in the UI package
5. **TypeScript strict mode:** Enable strict mode for better type safety
6. **Peer dependencies:** React and React DOM should be peer dependencies
7. **CSS variables:** Use CSS variables for theming (easier dark mode)
8. **Component naming:** Follow shadcn conventions (PascalCase, descriptive names)

## Advanced: Adding Custom Components

You can add your own custom components alongside shadcn components:

```typescript
// packages/ui/src/components/custom-button.tsx
import { Button, type ButtonProps } from "./button"

export interface CustomButtonProps extends ButtonProps {
  loading?: boolean
}

export function CustomButton({ loading, children, ...props }: CustomButtonProps) {
  return (
    <Button {...props} disabled={loading || props.disabled}>
      {loading ? "Loading..." : children}
    </Button>
  )
}
```

Export:
```typescript
// packages/ui/src/index.ts
export * from "./components/button"
export * from "./components/custom-button"
```

## Summary

With this setup:
- ✅ Centralized component library shared across all apps
- ✅ Type-safe imports with TypeScript
- ✅ Hot reload during development
- ✅ Tailwind CSS with proper theming
- ✅ Easy to add new components
- ✅ Turborepo caching and dependency management
- ✅ Clean import statements across apps

The UI package acts as a single source of truth for design system components, making it easy to maintain consistency across multiple applications.
