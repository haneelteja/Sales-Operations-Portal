-- ==============================================
-- FIX INVOICES RLS POLICIES
-- ==============================================
-- This script safely creates RLS policies for invoices table
-- It checks if policies exist before creating them
-- ==============================================

-- Step 1: Enable RLS on invoices table (if not already enabled)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist (to recreate them correctly)
DROP POLICY IF EXISTS "Allow authenticated users to read invoices" ON invoices;
DROP POLICY IF EXISTS "Allow authenticated users to insert invoices" ON invoices;
DROP POLICY IF EXISTS "Allow authenticated users to update invoices" ON invoices;

-- Step 3: Create policies for invoices table
CREATE POLICY "Allow authenticated users to read invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert invoices"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update invoices"
  ON invoices
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 4: Enable RLS on invoice_number_sequence table
ALTER TABLE invoice_number_sequence ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read invoice sequences" ON invoice_number_sequence;
DROP POLICY IF EXISTS "Allow authenticated users to manage invoice sequences" ON invoice_number_sequence;

-- Step 6: Create policies for invoice_number_sequence table
CREATE POLICY "Allow authenticated users to read invoice sequences"
  ON invoice_number_sequence
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage invoice sequences"
  ON invoice_number_sequence
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 7: Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('invoices', 'invoice_number_sequence')
ORDER BY tablename, policyname;
