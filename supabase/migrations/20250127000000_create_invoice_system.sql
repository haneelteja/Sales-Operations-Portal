-- ==============================================
-- INVOICE GENERATION SYSTEM MIGRATION
-- ==============================================
-- Creates tables and functions for automated invoice generation
-- Date: 2025-01-27
-- ==============================================

-- ==============================================
-- 1. INVOICE NUMBER SEQUENCE TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS invoice_number_sequence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prefix VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  current_sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prefix, year, month)
);

CREATE INDEX IF NOT EXISTS idx_invoice_seq_prefix_year_month 
  ON invoice_number_sequence(prefix, year, month);

-- ==============================================
-- 2. INVOICES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_id UUID NOT NULL REFERENCES sales_transactions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Invoice metadata
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- File storage references
  word_file_id VARCHAR(255),
  pdf_file_id VARCHAR(255),
  word_file_url TEXT,
  pdf_file_url TEXT,
  
  -- Storage provider info
  storage_provider VARCHAR(20) DEFAULT 'google_drive' 
    CHECK (storage_provider IN ('google_drive', 'onedrive')),
  folder_path TEXT,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'generated' 
    CHECK (status IN ('generated', 'sent', 'paid', 'cancelled')),
  last_regenerated_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_transaction_id ON invoices(transaction_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- ==============================================
-- 3. GENERATE INVOICE NUMBER FUNCTION
-- ==============================================
CREATE OR REPLACE FUNCTION generate_invoice_number(
  p_prefix VARCHAR DEFAULT 'INV',
  p_use_year BOOLEAN DEFAULT true,
  p_use_month BOOLEAN DEFAULT true
)
RETURNS VARCHAR AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
  v_sequence INTEGER;
  v_invoice_number VARCHAR;
  v_prefix_key VARCHAR;
BEGIN
  -- Get current year and month
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);
  v_month := EXTRACT(MONTH FROM CURRENT_DATE);
  
  -- Build prefix key based on options
  IF p_use_year AND p_use_month THEN
    v_prefix_key := p_prefix || '-' || v_year || '-' || LPAD(v_month::TEXT, 2, '0');
  ELSIF p_use_year THEN
    v_prefix_key := p_prefix || '-' || v_year;
  ELSE
    v_prefix_key := p_prefix;
  END IF;
  
  -- Get or create sequence record and increment
  INSERT INTO invoice_number_sequence (prefix, year, month, current_sequence)
  VALUES (v_prefix_key, v_year, v_month, 1)
  ON CONFLICT (prefix, year, month) 
  DO UPDATE SET 
    current_sequence = invoice_number_sequence.current_sequence + 1,
    updated_at = NOW()
  RETURNING current_sequence INTO v_sequence;
  
  -- Format invoice number: INV-2025-01-001 or INV-2025-001 or INV-00001
  IF p_use_year AND p_use_month THEN
    v_invoice_number := v_prefix_key || '-' || LPAD(v_sequence::TEXT, 3, '0');
  ELSIF p_use_year THEN
    v_invoice_number := v_prefix_key || '-' || LPAD(v_sequence::TEXT, 3, '0');
  ELSE
    v_invoice_number := v_prefix_key || '-' || LPAD(v_sequence::TEXT, 5, '0');
  END IF;
  
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 4. UPDATE INVOICES UPDATED_AT TRIGGER
-- ==============================================
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- ==============================================
-- 5. HELPER FUNCTION: GET INVOICE BY TRANSACTION
-- ==============================================
CREATE OR REPLACE FUNCTION get_invoice_by_transaction(p_transaction_id UUID)
RETURNS TABLE (
  id UUID,
  invoice_number VARCHAR,
  transaction_id UUID,
  customer_id UUID,
  invoice_date DATE,
  due_date DATE,
  word_file_id VARCHAR,
  pdf_file_id VARCHAR,
  word_file_url TEXT,
  pdf_file_url TEXT,
  storage_provider VARCHAR,
  folder_path TEXT,
  status VARCHAR,
  last_regenerated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.invoice_number,
    i.transaction_id,
    i.customer_id,
    i.invoice_date,
    i.due_date,
    i.word_file_id,
    i.pdf_file_id,
    i.word_file_url,
    i.pdf_file_url,
    i.storage_provider,
    i.folder_path,
    i.status,
    i.last_regenerated_at,
    i.created_at,
    i.updated_at
  FROM invoices i
  WHERE i.transaction_id = p_transaction_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================
-- Enable RLS on invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all invoices
CREATE POLICY "Allow authenticated users to read invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert invoices
CREATE POLICY "Allow authenticated users to insert invoices"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update invoices
CREATE POLICY "Allow authenticated users to update invoices"
  ON invoices
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable RLS on invoice_number_sequence table
ALTER TABLE invoice_number_sequence ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read invoice number sequences
CREATE POLICY "Allow authenticated users to read invoice sequences"
  ON invoice_number_sequence
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert/update invoice number sequences
CREATE POLICY "Allow authenticated users to manage invoice sequences"
  ON invoice_number_sequence
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ==============================================
COMMENT ON TABLE invoices IS 'Stores invoice records linked to sales transactions';
COMMENT ON TABLE invoice_number_sequence IS 'Tracks sequential invoice numbers per year/month';
COMMENT ON FUNCTION generate_invoice_number IS 'Generates unique sequential invoice numbers with optional year/month prefix';
