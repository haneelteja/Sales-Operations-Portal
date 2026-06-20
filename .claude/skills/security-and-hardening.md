---
name: security-and-hardening
description: Security rules for this financial operations portal. Reference when writing queries, mutations, or any code touching customer/financial data.
type: reference
---

# Security and Hardening — Aamodha Portal

This portal handles financial data (sales transactions, invoices, receivables, label purchases). Security is a constraint on every line of code, not a phase.

## Non-Negotiable Rules

**Never do:**
- Put the Supabase service role key in `src/` (client-side code). Only the anon key belongs in the frontend.
- Use `innerHTML` or `dangerouslySetInnerHTML` with user-supplied content.
- Log sensitive values (amounts, customer names, phone numbers) to the browser console.
- Trust client-side validation alone — always validate in RLS policies or Edge Functions.
- Commit `.env` or `.env.local` files.
- Use `SELECT *` on tables with sensitive financial columns when only a subset is needed.

**Always do:**
- Use Supabase RLS policies on every table that stores business data.
- Parameterise all Supabase queries (the JS client handles this — never concatenate SQL strings).
- Use the Supabase anon key for client access and let RLS control what each user can see.
- Scope queries to the authenticated user / organisation — never return all rows without a filter.

**Ask before doing:**
- Disabling RLS on any table (even temporarily)
- Adding a new Edge Function that uses the service role key
- Exposing a new column that wasn't previously queryable from the client
- Any migration involving `DROP` on a table with live data

## Supabase RLS Pattern

```sql
-- Every new table needs at least one policy
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Authenticated read (adjust to your auth model)
CREATE POLICY "authenticated_read" ON public.new_table
  FOR SELECT TO authenticated USING (true);

-- Restrict writes to service role or specific conditions
CREATE POLICY "service_write" ON public.new_table
  FOR ALL TO service_role USING (true);
```

## Input Handling

```typescript
// Sanitise before display — React escapes by default, but watch for:
// - URLs passed to href (validate scheme)
// - Content passed to a rich text renderer
// - File names from uploads

// Validate numeric inputs before Supabase mutations
const amount = parseFloat(rawInput);
if (isNaN(amount) || amount < 0) throw new Error('Invalid amount');
```

## Dependency Hygiene

Run `npm audit` before any major release. Treat HIGH and CRITICAL advisories as blockers.

## OWASP Relevant to This App

| Risk | Mitigation in this project |
|------|---------------------------|
| Broken Access Control | Supabase RLS + anon key only in client |
| Injection | Supabase JS client parameterises queries |
| Sensitive Data Exposure | No logging of financial data; no `SELECT *` |
| Security Misconfiguration | Never disable RLS; no wildcard CORS |
| XSS | React escapes by default; avoid `dangerouslySetInnerHTML` |
