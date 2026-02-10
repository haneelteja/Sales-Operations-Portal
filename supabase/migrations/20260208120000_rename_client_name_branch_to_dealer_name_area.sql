-- ==============================================
-- HARD RENAME: client_name → dealer_name, branch → area
-- ==============================================
-- No backward compatibility. Run after backup.
-- Execution order: drop dependents → rename columns → recreate objects.
-- ==============================================

-- ---------------------------------------------------------------------------
-- 1. DROP DEPENDENT OBJECTS (functions, policies, indexes)
-- ---------------------------------------------------------------------------

-- Functions that reference old column names
DROP FUNCTION IF EXISTS get_customer_receivables() CASCADE;
DROP FUNCTION IF EXISTS get_orders_sorted() CASCADE;
DROP FUNCTION IF EXISTS user_has_data_access(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS user_has_access_to_client_branch(TEXT, TEXT);

-- Policies that reference old columns (may not exist in all envs)
DROP POLICY IF EXISTS "Users can view sales transactions based on client/branch access" ON sales_transactions;
DROP POLICY IF EXISTS "Users can insert sales transactions based on client/branch access" ON sales_transactions;
DROP POLICY IF EXISTS "Users can update sales transactions based on client/branch access" ON sales_transactions;
DROP POLICY IF EXISTS "Users can delete sales transactions based on client/branch access" ON sales_transactions;
DROP POLICY IF EXISTS "Users can view customers based on client/branch access" ON customers;
DROP POLICY IF EXISTS "Users can insert customers based on client/branch access" ON customers;
DROP POLICY IF EXISTS "Users can update customers based on client/branch access" ON customers;
DROP POLICY IF EXISTS "Users can delete customers based on client/branch access" ON customers;

-- Indexes on customers (old column names)
DROP INDEX IF EXISTS idx_customers_client_name;
DROP INDEX IF EXISTS idx_customers_branch;
DROP INDEX IF EXISTS idx_customers_client_branch;
DROP INDEX IF EXISTS idx_customers_fts_combined;

-- Indexes on orders (branch)
DROP INDEX IF EXISTS idx_orders_fts_combined;

-- Optional indexes on transport_expenses.branch (created conditionally in performance_indexes)
DROP INDEX IF EXISTS idx_transport_expenses_branch;

-- Unique constraint on customers (name may vary)
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_client_name_branch_key;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_client_name_branch_uniq;

-- ---------------------------------------------------------------------------
-- 2. RENAME COLUMNS (idempotent: only if old column exists)
-- ---------------------------------------------------------------------------

-- customers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'client_name') THEN
    ALTER TABLE customers RENAME COLUMN client_name TO dealer_name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'branch') THEN
    ALTER TABLE customers RENAME COLUMN branch TO area;
  END IF;
END $$;

-- orders
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'branch') THEN
    ALTER TABLE orders RENAME COLUMN branch TO area;
  END IF;
END $$;

-- orders_dispatch (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders_dispatch') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders_dispatch' AND column_name = 'branch') THEN
      ALTER TABLE orders_dispatch RENAME COLUMN branch TO area;
    END IF;
  END IF;
END $$;

-- transport_expenses (if branch column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transport_expenses' AND column_name = 'branch') THEN
    ALTER TABLE transport_expenses RENAME COLUMN branch TO area;
  END IF;
END $$;

-- user_management: associated_clients → associated_dealers, associated_branches → associated_areas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_management' AND column_name = 'associated_clients') THEN
    ALTER TABLE user_management RENAME COLUMN associated_clients TO associated_dealers;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_management' AND column_name = 'associated_branches') THEN
    ALTER TABLE user_management RENAME COLUMN associated_branches TO associated_areas;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. RECREATE CONSTRAINTS AND INDEXES
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.customers'::regclass AND conname = 'customers_dealer_name_area_key') THEN
    ALTER TABLE customers ADD CONSTRAINT customers_dealer_name_area_key UNIQUE (dealer_name, area);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customers_dealer_name ON customers(dealer_name);
CREATE INDEX IF NOT EXISTS idx_customers_area ON customers(area);
CREATE INDEX IF NOT EXISTS idx_customers_dealer_area ON customers(dealer_name, area);

CREATE INDEX IF NOT EXISTS idx_customers_fts_combined ON customers USING GIN(
  to_tsvector('english',
    COALESCE(dealer_name, '') || ' ' ||
    COALESCE(area, '') || ' ' ||
    COALESCE(contact_person, '') || ' ' ||
    COALESCE(email, '') || ' ' ||
    COALESCE(phone, '')
  )
);

CREATE INDEX IF NOT EXISTS idx_orders_fts_combined ON orders USING GIN(
  to_tsvector('english', COALESCE(client, '') || ' ' || COALESCE(area, '') || ' ' || COALESCE(sku, ''))
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transport_expenses' AND column_name = 'area') THEN
    CREATE INDEX IF NOT EXISTS idx_transport_expenses_area ON transport_expenses(area);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. RECREATE FUNCTIONS (with dealer_name / area)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION user_has_data_access(table_name TEXT, dealer_name TEXT DEFAULT NULL, area_name TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  user_dealers TEXT[];
  user_areas TEXT[];
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_management um
    WHERE um.user_id = auth.uid()
    AND um.role = 'admin'
    AND um.status = 'active'
  ) INTO is_admin;

  IF is_admin THEN
    RETURN TRUE;
  END IF;

  BEGIN
    SELECT um.associated_dealers, um.associated_areas
    INTO user_dealers, user_areas
    FROM user_management um
    WHERE um.user_id = auth.uid()
    AND um.status = 'active';
  EXCEPTION
    WHEN OTHERS THEN
      RETURN FALSE;
  END;

  IF user_dealers IS NULL THEN
    RETURN FALSE;
  END IF;

  IF dealer_name IS NULL AND area_name IS NULL THEN
    RETURN array_length(user_dealers, 1) > 0;
  END IF;

  IF dealer_name IS NOT NULL THEN
    IF NOT (dealer_name = ANY(user_dealers)) THEN
      RETURN FALSE;
    END IF;
  END IF;

  IF area_name IS NOT NULL AND array_length(user_areas, 1) > 0 THEN
    IF NOT (area_name = ANY(user_areas)) THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_has_access_to_dealer_area(dealer_name TEXT, area_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_management um
    WHERE um.user_id = auth.uid()
    AND um.status = 'active'
    AND (
      um.role IN ('admin', 'manager')
      OR dealer_name = ANY(um.associated_dealers)
      OR (dealer_name = ANY(um.associated_dealers) AND area_name = ANY(um.associated_areas))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_customer_receivables()
RETURNS TABLE (
  customer_id uuid,
  customer_name text,
  area text,
  total_sales numeric,
  total_payments numeric,
  outstanding numeric,
  transaction_count bigint
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  WITH customer_totals AS (
    SELECT
      st.customer_id,
      COUNT(*) as transaction_count,
      SUM(CASE WHEN st.transaction_type = 'sale' THEN COALESCE(st.amount, 0) ELSE 0 END) as total_sales,
      SUM(CASE WHEN st.transaction_type = 'payment' THEN COALESCE(st.amount, 0) ELSE 0 END) as total_payments
    FROM sales_transactions st
    GROUP BY st.customer_id
  )
  SELECT
    c.id as customer_id,
    c.dealer_name as customer_name,
    c.area,
    COALESCE(ct.total_sales, 0) as total_sales,
    COALESCE(ct.total_payments, 0) as total_payments,
    COALESCE(ct.total_sales, 0) - COALESCE(ct.total_payments, 0) as outstanding,
    COALESCE(ct.transaction_count, 0) as transaction_count
  FROM customers c
  LEFT JOIN customer_totals ct ON c.id = ct.customer_id
  WHERE c.is_active = true
    AND (COALESCE(ct.total_sales, 0) - COALESCE(ct.total_payments, 0) > 0)
  ORDER BY outstanding DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_orders_sorted()
RETURNS TABLE (
  id uuid,
  date date,
  client text,
  area text,
  sku text,
  number_of_cases integer,
  tentative_delivery_date date,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.date,
    o.client,
    o.area,
    o.sku,
    o.number_of_cases,
    o.tentative_delivery_date,
    o.status,
    o.created_at,
    o.updated_at
  FROM orders o
  ORDER BY
    CASE WHEN o.status = 'pending' THEN 0 ELSE 1 END,
    o.tentative_delivery_date DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION get_customer_receivables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_sorted() TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_sorted() TO anon;
