# Incremental Implementation

Implement one task at a time. Each slice must leave the app in a working state before the next begins.

## The Cycle (per task)

```
Pick task → Implement → TypeScript passes → App builds → Verify → Commit → Next task
```

Never accumulate multiple tasks before committing. A commit is a save point.

## Rules

1. **One task at a time** — Complete and commit before starting the next.
2. **TypeScript must pass** — Run `npx tsc --noEmit` before committing.
3. **App must build** — Run `npm run build` if touching anything structural.
4. **Supabase migration first** — If a task includes a DB change, push the migration (`npx supabase db push`) before writing the React code that depends on it.
5. **Scope discipline** — Touch only the files the task requires. If you notice an adjacent problem, note it but don't fix it now.
6. **No console.log in commits** — Remove debug output before committing.

## For `/build auto` (autonomous multi-task)

Before starting:
- Confirm there are no uncommitted changes (`git status` is clean)
- Show the full ordered task list and get explicit approval
- Do not proceed on hedged approval ("looks reasonable" = ask again)

During auto-build:
- Each task gets its own commit
- Stop and surface to user: test failures, build breaks, ambiguous spec, or any destructive operation (migration with DROP, file deletion, auth change)
- After each commit, report: what changed, what was intentionally left alone

## Stack-Specific Checklist

For Supabase migrations:
- [ ] Migration file named `YYYYMMDDHHMMSS_description.sql`
- [ ] `npx supabase db push` succeeds
- [ ] TypeScript types updated if schema changed

For React components:
- [ ] Uses existing shadcn/ui components where possible
- [ ] Loading, empty, and error states handled
- [ ] Uses TanStack Query for data fetching (not raw fetch)
- [ ] No prop drilling more than 2 levels (use context or query)

For data mutations:
- [ ] Uses `useMutation` from TanStack Query
- [ ] Invalidates the right query keys on success
- [ ] Shows toast on success/error (use existing toast pattern)

## Commit Format

```
<type>: <short description>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `chore`, `migration`
