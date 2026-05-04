---
last_mapped: 2026-05-04
---

# Coding Conventions

## TypeScript

- **Strict mode enabled** — `strict: true` in `tsconfig.json`
- **Path aliases** — Use `@/` prefix for all internal imports
  - `@/components/ui/*` for shadcn components
  - `@/lib/*` for utilities
  - `@/db/*` for database
- **No explicit return types** on React components (inferred)
- **Type imports** — `import type { Metadata }` where applicable

## Component Patterns

### Client vs Server
- Pages with interactivity use `"use client"` directive
- Layouts are server components (except where noted)
- Forms are always client components
- Auth guards run server-side in layout

### Standard Animation Pattern
Every interactive page uses the same Motion variants:
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};
```

### Styling Conventions
- **Border radius:** `rounded-xl` is the standard (0.75rem base radius)
- **Interactive elements:** Always add `cursor-pointer`
- **Focus states:** `focus-visible:ring-2 focus-visible:ring-ring/50`
- **Glass effect:** `glass-card` custom class used on cards
- **Backdrop blur:** `backdrop-blur-xl` on header and sidebar
- **Transitions:** `transition-all duration-200` or `duration-300`
- **Shadows:** `shadow-sm shadow-primary/20` on primary buttons
- **Dark mode:** Uses `dark:` prefix with CSS variables

### Form Pattern
```typescript
const schema = z.object({ ... });
type FormType = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormType>({
  resolver: zodResolver(schema),
});
```

### i18n Pattern
```typescript
const t = useTranslations("namespace");
const tc = useTranslations("common");
```
All user-facing strings must use `t()` — no hardcoded text.

## Error Handling

### API Routes
```typescript
// Auth check first
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// Try/catch around DB operations
try { ... } catch (err) {
  const message = err instanceof Error ? err.message : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}
```

### Client-side
```typescript
toast.success(t("successKey"));
toast.error(error.message || t("fallbackKey"));
```

## Import Ordering (Observed)
1. React/Next built-ins
2. Third-party libraries
3. `@/` internal imports
4. Relative imports (rare)

## File Organization
- One main component per page file
- Helper components (like `GoogleIcon`) defined in same file
- No separate `types/` directory — types inline or inferred

## Accessibility Patterns
- `aria-label` on icon-only buttons
- `htmlFor` on labels matching input `id`
- `suppressHydrationWarning` on `<html>` for theme

## Console Logging
Per project rules: "Do not hesitate to extensively use console logs" — used for debugging flows during development.
