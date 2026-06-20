---
name: git-workflow-and-versioning
description: Git commit discipline for this project. Every change is committed and pushed after completion.
type: reference
---

# Git Workflow — Aamodha Portal

## Core Rule

**Commit and push after every completed change.** This project uses trunk-based development on `main`.

## Sequence for Every Change

```bash
# 1. Check what's changed
git diff --staged
git status

# 2. Verify no secrets
git diff --staged | grep -i "password\|secret\|api_key\|service_role"

# 3. TypeScript check
npx tsc --noEmit

# 4. Push Supabase migrations FIRST (if any .sql files in the diff)
npx supabase db push

# 5. Stage and commit
git add <specific files>
git commit -m "$(cat <<'EOF'
<type>: <description>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"

# 6. Push
git push
```

## Commit Types

| Type | When |
|------|------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `migration` | Supabase migration (schema change, data fix) |
| `refactor` | Code restructure, no behaviour change |
| `chore` | Deps, config, tooling |
| `docs` | Documentation only |

## Atomic Commits

Each commit = one logical thing. Examples:

```
migration: fix cost_per_label errors for Apr–May 2026 label purchases
feat: add Client Overview panel to dashboard
fix: merge GMG and GMG labels in vendor outstanding table
refactor: extract canonicalizeVendorName to shared util
```

Not:
```
update stuff
fix and also added new thing
misc changes
```

## What NOT to Commit

- `.env` / `.env.local` (Supabase keys)
- `node_modules/`
- `dist/`
- Editor-specific files (`.vscode/settings.json` unless shared config)
- Backup files (`*.bak`, `*.bak2`)

## Supabase Migration Naming

```
YYYYMMDDHHMMSS_short_description.sql

Examples:
20260621000000_add_stock_ready_to_orders.sql
20260623000001_fix_label_purchase_cost_per_label.sql
```

Always use a new timestamp — never reuse or edit an already-pushed migration.
