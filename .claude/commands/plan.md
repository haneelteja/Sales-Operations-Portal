# Planning and Task Breakdown

Decompose the current spec or request into small, ordered, independently verifiable tasks before writing any code.

## When to Use

- A feature touches 3+ files
- Work spans both frontend (React) and backend (Supabase migration/function)
- Multiple concerns that could be parallelised or sequenced differently
- Any time you're unsure where to start

## Process

**Step 1 — Read only, no code**

Read the spec, existing relevant files, and current Supabase schema. Do not write or edit anything yet.

**Step 2 — Map dependencies**

Identify what must exist before each task can start:
- Does the Supabase migration need to run before the React query can be written?
- Does a shared hook need to exist before the component that uses it?
- Does an API response shape need to be decided before both the query and the UI?

**Step 3 — Slice vertically**

Prefer end-to-end slices over horizontal layers:

```
Good (vertical):
  Task 1: Add `status` column migration + update TypeScript types
  Task 2: Add status filter to React Query hook
  Task 3: Render status badge in table row

Not this (horizontal):
  Task 1: All Supabase migrations
  Task 2: All hooks
  Task 3: All UI
```

**Step 4 — Write the task list**

Each task must have:
- **What**: one sentence description
- **Files**: which files will be created or changed
- **Acceptance**: 1–3 specific checks that confirm it's done
- **Depends on**: task numbers that must come first

**Step 5 — Present and get approval**

Show the full plan before implementing. Do not start until the user approves.

## Task Sizing

| Size | Files touched | Guideline |
|------|--------------|-----------|
| Small | 1–2 | Single component, single migration |
| Medium | 3–5 | Feature slice (migration + hook + component) |
| Large | 5+ | Split further |

## Red Flags

- A task description uses "and" (probably two tasks)
- More than 3 acceptance criteria bullets
- A task touches UI and database and a migration all at once
- No clear verification step ("it should work" is not acceptance criteria)
