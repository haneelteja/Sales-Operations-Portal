-- Migrate label_purchases / label_payments / back_label_purchases vendor_id
-- from TEXT (storing vendor name) to UUID FK referencing label_vendors(id).
--
-- History:
--   20250115000010: created label_vendors (UUID PK, vendor_name UNIQUE) with sample data
--   20250113000000: label_payments created with vendor TEXT NOT NULL
--   20251004000002: force-reset label_purchases.vendor_id UUID → TEXT (FK removed)
--   20260708100000: normalized 'GMG' → 'GMG labels' across both tables
--   App reads vendor dropdown from invoice_configurations JSON, never from label_vendors
--
-- NOTE: The UNIQUE constraint on label_vendors.vendor_name may not exist on the remote
-- if the CREATE TABLE IF NOT EXISTS was a no-op. We add the constraint at the end after
-- deduplicating rows, and avoid ON CONFLICT (vendor_name) throughout.

-- ── 0. Remove placeholder rows ────────────────────────────────────────────────
DELETE FROM public.label_vendors
WHERE vendor_name IN ('Sample Vendor 1', 'Sample Vendor 2');

-- ── 1. Add is_commercial flag ─────────────────────────────────────────────────
ALTER TABLE public.label_vendors
  ADD COLUMN IF NOT EXISTS is_commercial BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Populate from invoice_configurations (commercial vendors) ───────────────
-- Use INSERT WHERE NOT EXISTS + UPDATE to avoid requiring ON CONFLICT (vendor_name).
DO $$
DECLARE
  v_config TEXT;
  v_arr    JSONB;
  v_entry  JSONB;
  v_name   TEXT;
BEGIN
  SELECT config_value INTO v_config
  FROM public.invoice_configurations
  WHERE config_key = 'label_vendors'
  LIMIT 1;

  IF v_config IS NULL THEN RETURN; END IF;

  BEGIN
    v_arr := v_config::JSONB;
  EXCEPTION WHEN invalid_text_representation THEN RETURN; END;

  FOR v_entry IN SELECT * FROM jsonb_array_elements(v_arr)
  LOOP
    v_name := CASE
      WHEN jsonb_typeof(v_entry) = 'string' THEN v_entry #>> '{}'
      ELSE v_entry ->> 'vendor'
    END;
    IF v_name IS NOT NULL AND trim(v_name) != '' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.label_vendors WHERE lower(vendor_name) = lower(trim(v_name))
      ) THEN
        INSERT INTO public.label_vendors (vendor_name, is_commercial) VALUES (trim(v_name), true);
      ELSE
        UPDATE public.label_vendors SET is_commercial = true
        WHERE lower(vendor_name) = lower(trim(v_name));
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Ensure 'GMG labels' is present (legacy UUID rows in label_purchases map to this)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.label_vendors WHERE lower(vendor_name) = 'gmg labels') THEN
    INSERT INTO public.label_vendors (vendor_name, is_commercial) VALUES ('GMG labels', true);
  ELSE
    UPDATE public.label_vendors SET is_commercial = true WHERE lower(vendor_name) = 'gmg labels';
  END IF;
END;
$$;

-- ── 3. Populate non-commercial vendor names from existing purchase data ────────
-- Any vendor name not yet in label_vendors is an internal/non-commercial source.
-- Exclude UUID-format strings (handled above as GMG labels).
INSERT INTO public.label_vendors (vendor_name, is_commercial)
SELECT DISTINCT trim(vendor_id), false
FROM public.label_purchases
WHERE vendor_id IS NOT NULL
  AND trim(vendor_id) != ''
  AND vendor_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND NOT EXISTS (
    SELECT 1 FROM public.label_vendors lv
    WHERE lower(lv.vendor_name) = lower(trim(vendor_id))
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'label_payments' AND column_name = 'vendor_id'
  ) THEN
    INSERT INTO public.label_vendors (vendor_name, is_commercial)
    SELECT DISTINCT trim(vendor_id), false
    FROM public.label_payments
    WHERE vendor_id IS NOT NULL
      AND trim(vendor_id) != ''
      AND vendor_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND NOT EXISTS (
        SELECT 1 FROM public.label_vendors lv
        WHERE lower(lv.vendor_name) = lower(trim(vendor_id))
      );
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'label_payments' AND column_name = 'vendor'
  ) THEN
    EXECUTE $q$
      INSERT INTO public.label_vendors (vendor_name, is_commercial)
      SELECT DISTINCT trim(vendor), false
      FROM public.label_payments
      WHERE vendor IS NOT NULL
        AND trim(vendor) != ''
        AND NOT EXISTS (
          SELECT 1 FROM public.label_vendors lv
          WHERE lower(lv.vendor_name) = lower(trim(vendor))
        )
    $q$;
  END IF;
END;
$$;

INSERT INTO public.label_vendors (vendor_name, is_commercial)
SELECT DISTINCT trim(vendor_id), false
FROM public.back_label_purchases
WHERE vendor_id IS NOT NULL
  AND trim(vendor_id) != ''
  AND vendor_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND NOT EXISTS (
    SELECT 1 FROM public.label_vendors lv
    WHERE lower(lv.vendor_name) = lower(trim(vendor_id))
  );

-- ── 4. Deduplicate label_vendors on vendor_name (case-insensitive) ─────────────
-- Keep the row with is_commercial=true if duplicates exist; else keep oldest.
DO $$
DECLARE
  grp    RECORD;
  keep   UUID;
BEGIN
  FOR grp IN
    SELECT lower(vendor_name) AS key
    FROM public.label_vendors
    GROUP BY lower(vendor_name)
    HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO keep
    FROM public.label_vendors
    WHERE lower(vendor_name) = grp.key
    ORDER BY is_commercial DESC, created_at ASC NULLS LAST
    LIMIT 1;

    DELETE FROM public.label_vendors
    WHERE lower(vendor_name) = grp.key AND id != keep;
  END LOOP;
END;
$$;

-- ── 5. Add UNIQUE constraint on vendor_name (now safe — no duplicates) ────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.label_vendors'::regclass
      AND contype = 'u'
      AND array_length(conkey, 1) = 1
      AND conkey[1] = (
        SELECT attnum FROM pg_attribute
        WHERE attrelid = 'public.label_vendors'::regclass AND attname = 'vendor_name'
      )
  ) THEN
    ALTER TABLE public.label_vendors ADD CONSTRAINT label_vendors_vendor_name_key UNIQUE (vendor_name);
  END IF;
END;
$$;

-- ── 6. Add vendor_uuid UUID FK columns ───────────────────────────────────────
ALTER TABLE public.label_purchases
  ADD COLUMN IF NOT EXISTS vendor_uuid UUID
  REFERENCES public.label_vendors(id) ON DELETE SET NULL;

ALTER TABLE public.label_payments
  ADD COLUMN IF NOT EXISTS vendor_uuid UUID
  REFERENCES public.label_vendors(id) ON DELETE SET NULL;

ALTER TABLE public.back_label_purchases
  ADD COLUMN IF NOT EXISTS vendor_uuid UUID
  REFERENCES public.label_vendors(id) ON DELETE SET NULL;

-- ── 7. Backfill label_purchases ───────────────────────────────────────────────
-- 7a. Legacy rows where vendor_id is already a UUID string → map to 'GMG labels'
UPDATE public.label_purchases lp
SET    vendor_uuid = lv.id
FROM   public.label_vendors lv
WHERE  lower(lv.vendor_name) = 'gmg labels'
  AND  lp.vendor_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

-- 7b. Text name rows → case-insensitive lookup
UPDATE public.label_purchases lp
SET    vendor_uuid = lv.id
FROM   public.label_vendors lv
WHERE  lower(trim(lp.vendor_id)) = lower(lv.vendor_name)
  AND  lp.vendor_uuid IS NULL
  AND  lp.vendor_id IS NOT NULL
  AND  trim(lp.vendor_id) != '';

-- ── 8. Backfill label_payments ────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'label_payments' AND column_name = 'vendor_id'
  ) THEN
    UPDATE public.label_payments lpy
    SET    vendor_uuid = lv.id
    FROM   public.label_vendors lv
    WHERE  lower(trim(lpy.vendor_id)) = lower(lv.vendor_name)
      AND  lpy.vendor_id IS NOT NULL
      AND  trim(lpy.vendor_id) != '';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'label_payments' AND column_name = 'vendor'
  ) THEN
    EXECUTE $q$
      UPDATE public.label_payments lpy
      SET    vendor_uuid = lv.id
      FROM   public.label_vendors lv
      WHERE  lpy.vendor_uuid IS NULL
        AND  lpy.vendor IS NOT NULL
        AND  trim(lpy.vendor) != ''
        AND  lower(trim(lpy.vendor)) = lower(lv.vendor_name)
    $q$;
  END IF;
END;
$$;

-- ── 9. Backfill back_label_purchases ─────────────────────────────────────────
UPDATE public.back_label_purchases blp
SET    vendor_uuid = lv.id
FROM   public.label_vendors lv
WHERE  lower(trim(blp.vendor_id)) = lower(lv.vendor_name)
  AND  blp.vendor_id IS NOT NULL
  AND  trim(blp.vendor_id) != '';

-- ── 10. Swap columns ──────────────────────────────────────────────────────────
-- label_purchases: drop old TEXT vendor_id, rename vendor_uuid → vendor_id
ALTER TABLE public.label_purchases DROP COLUMN IF EXISTS vendor_id;
ALTER TABLE public.label_purchases RENAME COLUMN vendor_uuid TO vendor_id;

-- label_payments: drop both TEXT columns, rename vendor_uuid → vendor_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'label_payments' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE public.label_payments DROP COLUMN vendor_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'label_payments' AND column_name = 'vendor'
  ) THEN
    ALTER TABLE public.label_payments DROP COLUMN vendor;
  END IF;
END;
$$;
ALTER TABLE public.label_payments RENAME COLUMN vendor_uuid TO vendor_id;

-- back_label_purchases: drop TEXT vendor_id, rename vendor_uuid → vendor_id
ALTER TABLE public.back_label_purchases DROP COLUMN IF EXISTS vendor_id;
ALTER TABLE public.back_label_purchases RENAME COLUMN vendor_uuid TO vendor_id;

-- ── 11. Supporting indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_label_purchases_vendor_id
  ON public.label_purchases (vendor_id);

CREATE INDEX IF NOT EXISTS idx_label_payments_vendor_id
  ON public.label_payments (vendor_id);

CREATE INDEX IF NOT EXISTS idx_back_label_purchases_vendor_id
  ON public.back_label_purchases (vendor_id);
