# Ship

Run the full pre-launch checklist before deploying changes to production.

## This Project's Ship Sequence

```
1. TypeScript check      →  npx tsc --noEmit
2. Lint check            →  npm run lint
3. Build check           →  npm run build
4. Push DB migrations    →  npx supabase db push   (if any .sql files changed)
5. Git commit            →  git add <files> && git commit -m "..."
6. Git push              →  git push
```

Never push to git before `npx supabase db push` — the DB and code must stay in sync.

## Pre-Ship Checklist

### Code Quality
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` succeeds
- [ ] No `console.log` or debug statements left in committed files
- [ ] No TODO comments that should be resolved before shipping

### Data & Migrations
- [ ] All migration files follow naming: `YYYYMMDDHHMMSS_description.sql`
- [ ] `npx supabase db push` applied successfully
- [ ] New/changed tables have appropriate RLS policies
- [ ] TypeScript types match the current schema
- [ ] No accidental `DROP TABLE` or destructive migrations without confirmation

### Security
- [ ] No Supabase service role key or secrets in client-side code (`src/`)
- [ ] No new `innerHTML` with unsanitised content
- [ ] RLS policies verified for any new tables or columns
- [ ] No hardcoded user IDs or org-specific values in code

### UI / UX
- [ ] Loading state shown while data fetches
- [ ] Empty state handled (not a blank screen)
- [ ] Error state handled (not an unhandled exception)
- [ ] Works on a reasonable viewport (not only tested at max width)

### Git
- [ ] Commit message follows `<type>: <description>` format
- [ ] Only intended files are staged (run `git diff --staged`)
- [ ] Branch is `main` (this project uses trunk-based development)

## Rollback Plan

For any migration-based change:
- Document which migration was applied
- If a rollback is needed: write a new migration that reverses it — never `DROP` without a plan
- For frontend-only changes: revert the commit (`git revert <hash>`) and push

## Go / No-Go

**GO** when all checklist items above are green.

**NO-GO** if:
- TypeScript or build fails
- Migration push failed or was skipped
- A security finding from `/review` is unresolved
- A CRITICAL or REQUIRED finding is open
