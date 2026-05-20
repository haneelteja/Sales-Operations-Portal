-- Fix orders_dispatch: ensure 'area' column exists.
-- The table was originally created with 'branch'; rename it to 'area' for consistency.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders_dispatch' AND column_name = 'area'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'orders_dispatch' AND column_name = 'branch'
    ) THEN
      ALTER TABLE public.orders_dispatch RENAME COLUMN branch TO area;
    ELSE
      ALTER TABLE public.orders_dispatch ADD COLUMN area TEXT NOT NULL DEFAULT '';
    END IF;
  END IF;
END $$;

-- Also ensure 'updated_at' column exists (some versions of the table omit it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders_dispatch' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.orders_dispatch ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;
