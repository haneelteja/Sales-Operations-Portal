-- ============================================
-- SCHEMA VERIFICATION QUERIES
-- ============================================

-- 1. Check all tables in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check transport_expenses columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'transport_expenses' 
ORDER BY ordinal_position;

-- 3. Check if label_payments table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'label_payments';

-- 4. Check label_payments columns (if table exists)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'label_payments' 
ORDER BY ordinal_position;

-- 5. Check factory_payables columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'factory_payables' 
ORDER BY ordinal_position;

-- 6. Check sales_transactions columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sales_transactions' 
ORDER BY ordinal_position;

-- 7. Check customers columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- 8. Check label_purchases columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'label_purchases' 
ORDER BY ordinal_position;

-- ============================================
-- FIX MISSING COLUMNS/TABLES
-- ============================================

-- Add client_name to transport_expenses if missing
ALTER TABLE transport_expenses 
ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Create label_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS label_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id TEXT NOT NULL,
  payment_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on label_payments if needed
ALTER TABLE label_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for label_payments
DROP POLICY IF EXISTS "Allow all operations for development" ON label_payments;
CREATE POLICY "Allow all operations for development"
  ON label_payments FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VERIFY ALL FOREIGN KEYS
-- ============================================

SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;




