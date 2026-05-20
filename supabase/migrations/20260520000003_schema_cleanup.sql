-- ============================================================
-- Schema Cleanup Migration
-- 1. Archive unused tables (adjustments, label_design_costs)
-- 2. Rename area → branch in orders, orders_dispatch, transport_expenses
-- 3. Rename orders.date → order_date
-- 4. Rename user_management.associated_dealers/areas → associated_clients/branches
-- 5. Structural: add production.updated_at, drop label_availabilities.last_updated
-- 6. Add nullable customer_id FK to orders and orders_dispatch
-- 7. Update stale RPC functions to use branch instead of area
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Archive unused tables
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'adjustments'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_archived_adjustments'
  ) THEN
    ALTER TABLE public.adjustments RENAME TO _archived_adjustments;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'label_design_costs'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_archived_label_design_costs'
  ) THEN
    ALTER TABLE public.label_design_costs RENAME TO _archived_label_design_costs;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. orders: area → branch
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'area'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'branch'
  ) THEN
    ALTER TABLE public.orders RENAME COLUMN area TO branch;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 3. orders: date → order_date
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_date'
  ) THEN
    ALTER TABLE public.orders RENAME COLUMN date TO order_date;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 4. orders_dispatch: area → branch
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders_dispatch' AND column_name = 'area'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders_dispatch' AND column_name = 'branch'
  ) THEN
    ALTER TABLE public.orders_dispatch RENAME COLUMN area TO branch;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 5. transport_expenses: area → branch
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transport_expenses' AND column_name = 'area'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transport_expenses' AND column_name = 'branch'
  ) THEN
    ALTER TABLE public.transport_expenses RENAME COLUMN area TO branch;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 6. user_management: associated_dealers → associated_clients
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_management' AND column_name = 'associated_dealers'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_management' AND column_name = 'associated_clients'
  ) THEN
    ALTER TABLE public.user_management RENAME COLUMN associated_dealers TO associated_clients;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 7. user_management: associated_areas → associated_branches
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_management' AND column_name = 'associated_areas'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_management' AND column_name = 'associated_branches'
  ) THEN
    ALTER TABLE public.user_management RENAME COLUMN associated_areas TO associated_branches;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 8. production: add updated_at if missing
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'production' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.production
      ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 9. label_availabilities: drop redundant last_updated
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'label_availabilities' AND column_name = 'last_updated'
  ) THEN
    ALTER TABLE public.label_availabilities DROP COLUMN last_updated;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 10. orders: add nullable customer_id FK for future use
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 11. orders_dispatch: add nullable customer_id FK for future use
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders_dispatch' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.orders_dispatch ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 12. Update get_orders_sorted RPC: area → branch
-- ────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS get_orders_sorted();
CREATE OR REPLACE FUNCTION get_orders_sorted()
RETURNS TABLE (
  id UUID,
  order_date DATE,
  client TEXT,
  branch TEXT,
  sku TEXT,
  number_of_cases INTEGER,
  tentative_delivery_date DATE,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  customer_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.order_date,
    o.client,
    o.branch,
    o.sku,
    o.number_of_cases,
    o.tentative_delivery_date,
    o.status,
    o.created_at,
    o.updated_at,
    o.customer_id
  FROM orders o
  ORDER BY o.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_orders_sorted() TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_sorted() TO anon;

-- ────────────────────────────────────────────────────────────
-- 13. Update get_customer_receivables RPC: area → branch
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_customer_receivables()
RETURNS TABLE (
  customer_id UUID,
  customer_name TEXT,
  branch TEXT,
  total_sales NUMERIC,
  total_payments NUMERIC,
  outstanding NUMERIC,
  transaction_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS customer_id,
    c.client_name AS customer_name,
    c.branch,
    COALESCE(SUM(CASE WHEN st.transaction_type = 'sale' THEN st.amount ELSE 0 END), 0) AS total_sales,
    COALESCE(SUM(CASE WHEN st.transaction_type = 'payment' THEN st.amount ELSE 0 END), 0) AS total_payments,
    COALESCE(SUM(CASE WHEN st.transaction_type = 'sale' THEN st.amount ELSE -st.amount END), 0) AS outstanding,
    COUNT(st.id) AS transaction_count
  FROM customers c
  LEFT JOIN sales_transactions st ON st.customer_id = c.id
  GROUP BY c.id, c.client_name, c.branch;
END;
$$;

GRANT EXECUTE ON FUNCTION get_customer_receivables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_receivables() TO anon;

-- ────────────────────────────────────────────────────────────
-- 14. Update user_has_data_access: dealer_name/area_name → client_name/branch_name
-- ────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS user_has_data_access(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION user_has_data_access(
  table_name TEXT,
  client_name TEXT DEFAULT NULL,
  branch_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_associated_clients TEXT[];
  v_associated_branches TEXT[];
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN FALSE; END IF;

  SELECT role, associated_clients, associated_branches
  INTO v_role, v_associated_clients, v_associated_branches
  FROM user_management
  WHERE user_id = v_user_id AND status = 'active';

  IF v_role IN ('admin', 'manager') THEN RETURN TRUE; END IF;
  IF client_name IS NULL THEN RETURN TRUE; END IF;
  IF v_associated_clients IS NULL OR array_length(v_associated_clients, 1) = 0 THEN RETURN TRUE; END IF;
  IF NOT (client_name = ANY(v_associated_clients)) THEN RETURN FALSE; END IF;
  IF branch_name IS NULL THEN RETURN TRUE; END IF;
  IF v_associated_branches IS NULL OR array_length(v_associated_branches, 1) = 0 THEN RETURN TRUE; END IF;

  RETURN branch_name = ANY(v_associated_branches);
END;
$$;

GRANT EXECUTE ON FUNCTION user_has_data_access(TEXT, TEXT, TEXT) TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 15. Update user_has_access_to_dealer_area → user_has_access_to_client_branch
-- ────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS user_has_access_to_dealer_area(TEXT, TEXT);
CREATE OR REPLACE FUNCTION user_has_access_to_client_branch(
  client_name TEXT,
  branch_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN user_has_data_access(NULL, client_name, branch_name);
END;
$$;

GRANT EXECUTE ON FUNCTION user_has_access_to_client_branch(TEXT, TEXT) TO authenticated;
