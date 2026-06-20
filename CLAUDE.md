# Aamodha Operations Portal — Claude Instructions

## Project

Full-stack business operations system for Aamodha: sales transactions, order management, factory operations, accounts receivable, label purchases, and client pricing.

**Stack:** React 18 + TypeScript + Vite + Supabase (Postgres + RLS + Edge Functions) + shadcn/ui + TanStack React Query

## Slash Commands (Skills)

| Command | Use when |
|---------|---------|
| `/spec` | Planning any non-trivial new feature |
| `/plan` | Breaking a feature into ordered tasks |
| `/build` | Implementing tasks one at a time |
| `/review` | Reviewing code before committing |
| `/ship` | Pre-deploy checklist + commit + push |

## Non-Negotiable Rules

1. **Supabase before git** — Always run `npx supabase db push` before `git push` if any migration files changed.
2. **Commit and push after every change** — No accumulated uncommitted work.
3. **TypeScript must pass** — `npx tsc --noEmit` before committing.
4. **No service role key in `src/`** — Client code uses only the anon key; RLS controls access.
5. **Migrations are append-only** — Never edit a migration that has already been pushed. Write a new one.

## Supabase Migration Naming

```
YYYYMMDDHHMMSS_short_description.sql
```

## Key Patterns

- Data fetching: TanStack Query (`useQuery` / `useMutation`)
- UI components: shadcn/ui only — no custom modal/dialog/select/button primitives
- Supabase client: `src/integrations/supabase/client.ts`
- Feature structure: `src/components/<feature>/`
- Every data view needs: loading state, empty state, error state

## Skill Reference Files

Detailed guidance in `.claude/skills/`:
- `frontend-ui-engineering.md` — React/shadcn/TanStack patterns
- `security-and-hardening.md` — RLS, data exposure, input handling
- `debugging.md` — Systematic debugging workflow
- `git-workflow.md` — Commit discipline and migration naming
- `hooks.md` — Claude Code lifecycle hooks pattern (SessionStart, PreToolUse)
