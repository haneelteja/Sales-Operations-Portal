-- Create Full-Text Search Indexes for Enhanced Search System
-- Only creates indexes when the corresponding table exists (safe migration order)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_transactions') THEN
    CREATE INDEX IF NOT EXISTS idx_sales_transactions_fts_sku ON sales_transactions USING GIN(to_tsvector('english', COALESCE(sku, '')));
    CREATE INDEX IF NOT EXISTS idx_sales_transactions_fts_description ON sales_transactions USING GIN(to_tsvector('english', COALESCE(description, '')));
    CREATE INDEX IF NOT EXISTS idx_sales_transactions_fts_combined ON sales_transactions USING GIN(to_tsvector('english', COALESCE(sku, '') || ' ' || COALESCE(description, '')));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_fts_combined ON orders USING GIN(to_tsvector('english', COALESCE(client, '') || ' ' || COALESCE(branch, '') || ' ' || COALESCE(sku, '')));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    CREATE INDEX IF NOT EXISTS idx_customers_fts_combined ON customers USING GIN(to_tsvector('english', COALESCE(client_name, '') || ' ' || COALESCE(branch, '') || ' ' || COALESCE(contact_person, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_management') THEN
    CREATE INDEX IF NOT EXISTS idx_user_management_fts_combined ON user_management USING GIN(to_tsvector('english', COALESCE(username, '') || ' ' || COALESCE(email, '')));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'factory_payables') THEN
    CREATE INDEX IF NOT EXISTS idx_factory_payables_fts_combined ON factory_payables USING GIN(to_tsvector('english', COALESCE(description, '') || ' ' || COALESCE(sku, '')));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transport_expenses') THEN
    CREATE INDEX IF NOT EXISTS idx_transport_expenses_fts_combined ON transport_expenses USING GIN(to_tsvector('english', COALESCE(expense_group, '') || ' ' || COALESCE(description, '')));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'label_purchases') THEN
    CREATE INDEX IF NOT EXISTS idx_label_purchases_fts_combined ON label_purchases USING GIN(to_tsvector('english', COALESCE(vendor_id, '') || ' ' || COALESCE(sku, '') || ' ' || COALESCE(description, '')));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'label_payments') THEN
    CREATE INDEX IF NOT EXISTS idx_label_payments_fts_combined ON label_payments USING GIN(to_tsvector('english', COALESCE(vendor, '') || ' ' || COALESCE(payment_method, '')));
  END IF;
END $$;

-- Function to perform full-text search across multiple fields
CREATE OR REPLACE FUNCTION search_fulltext(
  table_name TEXT,
  search_text TEXT,
  fields TEXT[]
)
RETURNS TABLE(id UUID, rank REAL) AS $$
DECLARE
  field_list TEXT;
  query_text TEXT;
BEGIN
  field_list := array_to_string(fields, ' || '' '' || ');
  query_text := format('
    SELECT id, ts_rank(
      to_tsvector(''english'', %s),
      plainto_tsquery(''english'', %L)
    ) as rank
    FROM %I
    WHERE to_tsvector(''english'', %s) @@ plainto_tsquery(''english'', %L)
    ORDER BY rank DESC
  ', field_list, search_text, table_name, field_list, search_text);
  RETURN QUERY EXECUTE query_text;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION search_fulltext(TEXT, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION search_fulltext(TEXT, TEXT, TEXT[]) TO anon;
