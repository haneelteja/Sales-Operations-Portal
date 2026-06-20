---
name: frontend-ui-engineering
description: React/TypeScript/shadcn/ui patterns for this project. Reference when building or reviewing UI components.
type: reference
---

# Frontend UI Engineering — Aamodha Portal

## Stack

- React 18 + TypeScript (strict)
- Vite (bundler)
- shadcn/ui (component library — radix-ui primitives + Tailwind)
- TanStack React Query v5 (data fetching + caching)
- Supabase JS client (`src/integrations/supabase/client.ts`)

## Component Structure

```
src/components/<feature>/
  <FeaturePage>.tsx       ← page-level component (data fetching)
  <FeatureTable>.tsx      ← presentational table
  <FeatureForm>.tsx       ← form / dialog
  use<Feature>.ts         ← custom hook (query + mutation logic)
```

Keep data-fetching in page-level components or hooks. Keep presentational components pure.

## Data Fetching Patterns

```typescript
// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['feature', filters],
  queryFn: () => supabase.from('table').select('*').eq('col', val),
});

// Mutation
const mutation = useMutation({
  mutationFn: (payload) => supabase.from('table').insert(payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['feature'] });
    toast({ title: 'Saved' });
  },
  onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
});
```

## Required States

Every data-driven component must handle:

```tsx
if (isLoading) return <Skeleton className="h-48 w-full" />;
if (error) return <div className="text-destructive">Failed to load: {error.message}</div>;
if (!data?.length) return <div className="text-muted-foreground">No records found.</div>;
```

## shadcn/ui Usage

- Use `<Table>`, `<TableHeader>`, `<TableRow>`, `<TableCell>` for all tabular data
- Use `<Dialog>` / `<Sheet>` for forms and detail views — never a custom modal
- Use `<Button variant="outline">` for secondary actions, default for primary
- Use `<Badge>` for status indicators with semantic colours
- Use `<Card>` + `<CardHeader>` + `<CardContent>` for panels
- Use `<Select>` from shadcn for all dropdowns — not native `<select>`

## Avoid AI Aesthetic Pitfalls

| Pattern to avoid | Use instead |
|-----------------|-------------|
| Purple/indigo everything | Follow existing colour tokens |
| Enormous padding (p-12) | Use standard spacing (p-4, p-6) |
| Gradient backgrounds | Flat surfaces |
| Unnecessary animations | Static by default; animate only for data changes |
| Emoji in UI | Text labels only |

## Accessibility Minimums

- All interactive elements reachable by keyboard
- `<Button>` over `<div onClick>`
- Form inputs have associated `<label>` or `aria-label`
- Error messages linked to their input via `aria-describedby`
- Focus trap inside `<Dialog>` (shadcn handles this — don't override it)

## Performance

- Wrap expensive derived values in `useMemo` with correct dep array
- Paginate or virtualise lists over ~200 rows
- Don't fetch inside a render loop; use query keys to share cache
- Prefer `select` on Supabase queries to fetch only needed columns
