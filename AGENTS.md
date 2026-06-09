# GO-TECH-FRONTEND AGENTS.md

## Overview

**go-tech-frontend** is a monorepo for multiple React/Next.js applications built with pnpm workspaces:

- **web-h5**: Next.js 16 mobile/customer portal app
- **web-admin**: Vite 7 admin dashboard SPA
- **hr-pc-manager**: Vite 5 HR management PC app
- **hr_mobile_manager**: Vite 5 HR management mobile app

**Shared packages**:
- `@go-tech-frontend/ui`: Radix UI + CVA component library
- `@go-tech-frontend/lib`: TypeScript utilities & hooks
- `@go-tech-frontend/styles`: Tailwind CSS + global styles
- `@go-tech-frontend/three`: Three.js utilities

---

## Development Setup

**Environment**: Node.js 18+, pnpm 10.17.0+

```bash
# Install dependencies
pnpm install

# Development servers (run from root)
pnpm dev:h5          # web-h5 on port 3200 (Next.js)
pnpm dev:admin       # web-admin on port 5173 (Vite)
pnpm dev:hr-pc       # hr-pc-manager on port 5175
pnpm dev:hr-mobile   # hr_mobile_manager on port 5175

# Build
pnpm build:h5
pnpm build:admin
pnpm build:hr-pc
pnpm build:hr-mobile

# Type check all apps
pnpm type-check

# Format code (Prettier)
pnpm format
```

**Environment files**: Each app has `.env` file with `VITE_*` or `NEXT_PUBLIC_*` prefixes.

---

## Project Structure

```
packages/
  ├── ui/                 # Radix UI components (button, dialog, form, etc.)
  ├── lib/                # Utilities: cn(), truncate(), formatNumber(), hooks
  ├── styles/             # Tailwind CSS + global variables.css
  └── three/              # Three.js helpers & GSAP animations

apps/
  ├── web-h5/             # Next.js app (portal, orders, packages)
  │   ├── app/            # Next.js App Router (server/client components)
  │   ├── contexts/       # React Context (AuthContext)
  │   ├── lib/            # HTTP client, utilities
  │   └── components/     # Reusable components
  ├── web-admin/          # Vite + React SPA (admin dashboard)
  │   ├── src/pages/      # Page components (route-based)
  │   ├── src/components/ # Shared components
  │   ├── src/hooks/      # Custom hooks
  │   └── vite.config.ts  # PWA, GLSL shader, React compiler plugin
  ├── hr-pc-manager/      # Vite + React HR (desktop)
  └── hr_mobile_manager/  # Vite + React HR (mobile)
```

---

## Tech Stack & Conventions

### Styling
- **Tailwind CSS**: Primary styling framework (v3 in HR apps, v4 in web apps)
- **CVA**: Class Variance Authority for composable component variants
- **Radix UI**: Unstyled component primitives (Button, Dialog, Form, DatePicker, etc.)
- **Lucide React**: Icon library

### UI Components
Components in `packages/ui/src/` use this pattern:

```typescript
import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@go-tech-frontend/lib";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // ... more variants
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      />
    );
  }
);
```

### API & Authentication
- **HTTP Client**: Centralized in `apps/web-h5/lib/http.ts` (fetch-based)
- **Auth Token**: `GO_TECH_AUTH_TOKEN` cookie, Bearer token header
- **React Query**: Used in web-admin for data fetching (`@tanstack/react-query`)
- **Context API**: Used in web-h5 (AuthContext, custom `useAuth()` hook)

### Forms
- **React Hook Form**: For complex forms (web-admin, HR apps)
- **Zod**: Schema validation
- **Controlled Inputs**: Fallback pattern with `useState` for simple forms

### State Management
- **React Context**: Auth, user data (web-h5)
- **React Query**: Server state (web-admin)
- **useState/useReducer**: Local component state

---

## Code Style & Conventions

### Commit Messages
Format: `<type>(<scope>): <description>`

```
feat(web-h5): add new feature
fix(web-admin): resolve bug
refactor(ui): optimize component
chore(styles): update tailwind
```

Types: `feat`, `fix`, `refactor`, `chore`

### TypeScript
- **Strict mode**: Enabled in web-h5 (`strictNullChecks: true`)
- **Mixed mode**: Relaxed in web-admin (`strictNullChecks: false`)
- **Path aliases**: `@/*` (web-h5) or `./src/*` (web-admin)
- **No unused vars or any warnings** are disabled in ESLint configs

### File Naming
- Components: `kebab-case` (e.g., `alert-dialog.tsx`, `date-picker.tsx`)
- Utilities: `kebab-case` (e.g., `format-number.ts`)
- TypeScript config: `tsconfig.json`
- Vite config: `vite.config.ts`

### Prettier Settings
- Print width: 80
- Tab width: 2
- Trailing commas: ES5 (when multiline)
- Quotes: Double quotes
- Semicolons: Enabled

---

## Key Files & Utilities

### From `@go-tech-frontend/lib`

```typescript
// Class merging (Tailwind + utility classes)
import { cn } from "@go-tech-frontend/lib";
cn("px-2 py-1", condition && "bg-red-500");

// Text truncation
import { truncate } from "@go-tech-frontend/lib";
truncate("long text", 10); // Returns "long text..."

// Number formatting
import { formatNumber } from "@go-tech-frontend/lib";
formatNumber(1000); // Returns "1,000"

// Type guards
import { isObject, isString, isUndef } from "@go-tech-frontend/lib";

// Hooks
import { useCountDown, useLatest } from "@go-tech-frontend/lib";
```

### HTTP Client (web-h5)

```typescript
import { HttpClient } from "@/lib/http";

const http = new HttpClient();

// Methods: get(), post(), put(), delete(), request()
const data = await http.get("/api/orders");
const response = await http.post("/api/submit", { /* data */ });
```

### React Query Usage (web-admin)

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";

const { data, isLoading, error } = useQuery({
  queryKey: ["orders"],
  queryFn: () => fetch("/api/orders").then(r => r.json()),
});

const mutation = useMutation({
  mutationFn: (data) => fetch("/api/orders", { method: "POST", body: JSON.stringify(data) }),
  onSuccess: () => { /* invalidate queries */ },
});
```

---

## Common Patterns

### Creating a New Component

1. Use Radix UI primitives from `packages/ui`
2. Apply Tailwind classes + CVA variants
3. Export with `forwardRef` for ref forwarding

Example:
```typescript
import { Button } from "@go-tech-frontend/ui";
import { cn } from "@go-tech-frontend/lib";

export function MyComponent() {
  return (
    <Button variant="outline" size="lg" className={cn("w-full")}>
      Click me
    </Button>
  );
}
```

### Creating an API Call

1. Use centralized HTTP client (web-h5) or React Query (web-admin)
2. Define response types with TypeScript
3. Handle errors with try-catch or error callbacks

Example:
```typescript
type OrderResponse = {
  id: string;
  status: "pending" | "completed";
};

const order = await http.get<OrderResponse>("/api/orders/123");
```

### Form Submission

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function LoginForm() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    const response = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

---

## Important Notes

1. **Mixed React versions**: web-h5 uses React 19, HR apps use React 18
2. **Mixed Tailwind versions**: web-h5 uses v4, HR apps use v3
3. **pnpm workspaces**: Use `pnpm -F @go-tech-frontend/ui build` to build specific packages
4. **Environment variables**: Prefix with `VITE_` (Vite apps) or `NEXT_PUBLIC_` (Next.js)
5. **Memory optimization**: web-h5 build uses `--max-old-space-size=4096` flag
6. **Path aliases**: Each app has different alias conventions (check their tsconfig.json)

---

## Troubleshooting

- **Dependencies not installing**: Run `pnpm install` with `--no-frozen-lockfile` if needed
- **Type errors in editor**: Run `pnpm type-check` to verify TypeScript compilation
- **Port conflicts**: Change dev ports in respective `vite.config.ts` or `next.config.js`
- **Tailwind classes not applying**: Ensure `packages/ui` is listed in tailwind.config.js `content`

---

## Useful Commands

```bash
# Filter commands to specific workspace
pnpm -F web-h5 dev

# Check for type errors across all apps
pnpm type-check

# Format all code
pnpm format

# Build all packages and apps
pnpm build

# Run ESLint
pnpm lint
```

**Documentation**: See individual app READMEs and `packages/ui` for component usage.
