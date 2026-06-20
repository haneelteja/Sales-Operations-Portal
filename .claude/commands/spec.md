# Spec-Driven Development

Write a detailed specification before any code is written. The spec surfaces assumptions and misunderstandings early — before they become expensive.

## When to Use

- Starting a new feature or module (new page, new panel, new table)
- Ambiguous requirements that could be interpreted multiple ways
- Changes touching 3+ files or spanning multiple concerns
- Architectural decisions (new Supabase table, new Edge Function, new route)

## Process

**Step 1 — Clarify**

Ask the user (if not already clear):
- What problem does this solve? Who uses it?
- What does success look like — what should work that doesn't today?
- Any constraints: must reuse existing Supabase tables, must match existing UI patterns, must work offline?
- What's explicitly out of scope?

**Step 2 — Write SPEC.md**

Create `SPEC.md` in the project root (or `docs/SPEC.md`) covering:

```markdown
# [Feature Name]

## Objective
What this feature does and why it's needed.

## Users
Who uses this feature and in what context.

## Core Functionality
- [ ] Requirement 1 (specific, testable)
- [ ] Requirement 2
- ...

## Data Model
- Supabase tables involved (existing / new)
- Key columns and relationships
- RLS policies needed

## UI Behaviour
- Page/component location
- States: loading, empty, error, populated
- shadcn/ui components to use
- Mobile behaviour

## Out of Scope
What this does NOT do (prevents scope creep).

## Success Criteria
How we know the feature is complete.
```

**Step 3 — Review Together**

Present the spec to the user and get explicit sign-off before writing any code. Update the spec whenever scope changes.

## Rules

- No code before spec approval on non-trivial changes
- Spec is committed alongside code (`git add SPEC.md`)
- If the spec changes mid-implementation, update it first, then continue
