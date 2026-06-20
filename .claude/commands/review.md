# Code Review

Review the current changes (staged or on this branch) across five axes before committing or merging.

## Five Review Axes

### 1. Correctness
- Does it do what the spec or task said?
- Are edge cases handled: empty data, null/undefined, network error, zero quantities?
- Do Supabase queries filter correctly (no missing WHERE clauses, correct RLS coverage)?
- Are mutation side effects correct (right query keys invalidated, outstanding recalculated)?

### 2. Readability
- Can another engineer understand it without asking questions?
- Are variable/function names self-explanatory?
- Is logic extractable (a 50-line useMemo with 10 branches should be split)?

### 3. Architecture
- Does it follow existing patterns in this codebase?
  - TanStack Query for all data fetching
  - shadcn/ui for all UI primitives
  - Feature-folder structure (`src/components/<feature>/`)
  - Supabase client from `src/integrations/supabase/client.ts`
- Is new abstraction justified, or is it premature?
- Did it modify only what the task required?

### 4. Security
- No secrets, API keys, or service role keys in client code
- No direct `innerHTML` with user-supplied content
- Supabase RLS policies cover the data being exposed
- User input sanitised before use in queries or display
- No `SELECT *` on tables with sensitive columns

### 5. Performance
- No N+1 patterns (query inside a loop)
- Large lists use pagination or virtualisation
- Expensive computations wrapped in `useMemo` / `useCallback` with correct deps
- Images optimised; no large assets committed to repo

## Output Format

For each finding, label it:

- **CRITICAL** — Must fix before commit (data loss, security hole, broken feature)
- **REQUIRED** — Must fix before commit (code quality, wrong pattern)
- **SUGGESTION** — Consider but not blocking
- **NIT** — Style preference, non-blocking

Give file + approximate line reference for every finding.

End with a summary verdict: **APPROVE**, **APPROVE WITH NITS**, or **CHANGES REQUIRED**.

## Quick Self-Check (run before review)

```bash
npx tsc --noEmit          # TypeScript clean?
npm run lint              # ESLint clean?
git diff --staged         # What's actually being committed?
```
