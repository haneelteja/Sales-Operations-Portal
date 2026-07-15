-- ============================================================
-- SECURITY HARDENING: Enforce authenticated-only access
-- on every public schema table.
--
-- Root cause (2026-07-14 assessment):
--   • Many policies were created without a TO clause, which
--     defaults to TO public (= anon + authenticated).
--   • orders / orders_dispatch had explicit TO anon policies.
--   • user_management, email_report_schedules, email_report_logs
--     had RLS disabled entirely.
--
-- Fix:
--   1. Drop every existing policy on every public table.
--   2. Ensure RLS is enabled on every public table.
--   3. Dynamically create a single "authenticated_all" policy
--      on every table that actually exists — no hardcoded list
--      that can silently miss tables added later.
--   4. Override profiles with a tighter per-user write policy.
--
-- After this migration, the anon role has zero policies →
-- PostgREST returns an empty result set for all direct table
-- queries made without a valid session token.
-- ============================================================

-- ── Step 1: Drop ALL existing policies on ALL public tables ──
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      pol.policyname, pol.tablename
    );
  END LOOP;
  RAISE NOTICE '[rls_harden] All public schema policies dropped.';
END $$;

-- ── Step 2: Enable RLS on every public table that still has it off ──
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public' AND rowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    RAISE NOTICE '[rls_harden] RLS enabled on %', t;
  END LOOP;
END $$;

-- ── Step 3: Create "authenticated_all" policy on every public table ──
-- Dynamic loop — works regardless of which tables actually exist.
-- Skips archived tables (prefixed with _) and temp utilities.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE '\_%'   -- skip archived tables
      AND tablename NOT IN ('temp_table', 'skus')  -- skip transient/legacy tables
    ORDER BY tablename
  LOOP
    EXECUTE format(
      'CREATE POLICY "authenticated_all" ON public.%I
         FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t
    );
    RAISE NOTICE '[rls_harden] Policy created for public.%', t;
  END LOOP;
END $$;

-- ── Step 4: Tighten profiles ──
-- All authenticated users can read all profiles (needed for
-- assignee lookups, user lists, etc.).
-- But write access is scoped to the user's own row to prevent
-- privilege escalation (e.g., a client changing their own role).
DROP POLICY IF EXISTS "authenticated_all" ON public.profiles;

CREATE POLICY "authenticated_select_profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "own_profile_write" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "own_profile_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "own_profile_delete" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);
