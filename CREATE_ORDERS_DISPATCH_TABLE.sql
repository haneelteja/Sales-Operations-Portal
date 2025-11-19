-- ==============================================
-- CREATE ORDERS_DISPATCH TABLE
-- This table stores dispatched orders for reporting
-- ==============================================

-- Create orders_dispatch table
CREATE TABLE IF NOT EXISTS public.orders_dispatch (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client TEXT NOT NULL,
  branch TEXT NOT NULL,
  sku TEXT NOT NULL,
  cases INTEGER NOT NULL,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  order_id UUID, -- Reference to original order if needed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_dispatch_client ON public.orders_dispatch(client);
CREATE INDEX IF NOT EXISTS idx_orders_dispatch_delivery_date ON public.orders_dispatch(delivery_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_dispatch_created_at ON public.orders_dispatch(created_at DESC);

-- Enable RLS
ALTER TABLE public.orders_dispatch ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "orders_dispatch_select_policy" 
ON public.orders_dispatch 
FOR SELECT 
USING (true);

CREATE POLICY "orders_dispatch_insert_policy" 
ON public.orders_dispatch 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "orders_dispatch_update_policy" 
ON public.orders_dispatch 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "orders_dispatch_delete_policy" 
ON public.orders_dispatch 
FOR DELETE 
USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders_dispatch TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders_dispatch TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders_dispatch TO public;

-- Verify table creation
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders_dispatch'
ORDER BY ordinal_position;

