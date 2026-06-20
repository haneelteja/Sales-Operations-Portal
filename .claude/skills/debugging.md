---
name: debugging-and-error-recovery
description: Systematic debugging workflow. Reference when something is broken and the cause isn't immediately obvious.
type: reference
---

# Debugging and Error Recovery

## Stop-the-Line Rule

When something breaks: stop all feature work, preserve evidence, diagnose root cause, fix it, verify it's gone.

Do not add workarounds on top of a broken system.

## Six Steps

### 1. Reproduce

Make the failure happen reliably. If you can't reproduce it, you can't verify the fix.

- What exact action triggers it?
- Does it happen in a fresh browser tab? Incognito?
- Does it happen with specific data only?

### 2. Localise — Which Layer?

| Symptom | Likely layer |
|---------|-------------|
| React render error / blank screen | Component logic, missing null check |
| `TypeError: Cannot read property of undefined` | Data shape mismatch (Supabase returned different shape than expected) |
| Supabase query returns empty / wrong rows | RLS policy, wrong filter, missing join |
| Migration fails | SQL syntax, constraint violation, wrong column reference |
| TypeScript error | Type mismatch between DB schema and TypeScript types |
| Data appears stale | TanStack Query cache not invalidated, stale `queryKey` |

```bash
# Find which commit introduced the bug
git log --oneline -20
git diff HEAD~3..HEAD -- src/
```

### 3. Reduce

Strip away everything unrelated. The simplest reproduction reveals the cause.

- Hard-code the data — does the bug disappear? (Data problem)
- Remove the component from the page — does the error stop? (Component problem)
- Run the Supabase query in the dashboard directly — does it return what you expect?

### 4. Fix Root Cause

Fix the underlying issue, not the symptom.

| Symptom fix (wrong) | Root cause fix (right) |
|---------------------|----------------------|
| Add `?? []` fallback everywhere | Fix the Supabase query to never return null for that field |
| Catch and swallow the error | Understand why the error occurs and handle the actual case |
| Add `// @ts-ignore` | Fix the type mismatch |

### 5. Guard Against Recurrence

After fixing, ask: "How do I make sure this doesn't happen again?"

- Add a TypeScript type that makes the bad state impossible
- Add a null check or default value at the data boundary
- Add a migration constraint to prevent invalid DB state

### 6. Verify

- The specific failure no longer reproduces
- Adjacent functionality still works
- TypeScript and build still pass

## Common Patterns in This Project

**TanStack Query cache not updating:**
```typescript
// Wrong key means invalidation misses
queryClient.invalidateQueries({ queryKey: ['sales'] }); // too broad or wrong

// Match exact key structure used in useQuery
queryClient.invalidateQueries({ queryKey: ['sales', { clientId, dateRange }] });
```

**Supabase migration error referencing old column:**
```sql
-- Check what columns actually exist before writing migration
SELECT column_name FROM information_schema.columns
WHERE table_name = 'your_table';
```

**React Error Boundary — add to catch unhandled render errors:**
```tsx
// Wrap feature sections in an error boundary to prevent full-page crashes
<ErrorBoundary fallback={<div>Something went wrong loading this section.</div>}>
  <FeatureComponent />
</ErrorBoundary>
```
