-- Fix all client pricing discrepancies identified from authoritative spreadsheet (2026-06-22).
-- Also patches trigger_recalculate_on_customer_price_change which still referenced the
-- old column alias NEW.dealer_name / NEW.area (renamed to client_name / branch).

CREATE OR REPLACE FUNCTION trigger_recalculate_on_customer_price_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.price_per_case IS NOT DISTINCT FROM OLD.price_per_case
     AND NEW.pricing_date IS NOT DISTINCT FROM OLD.pricing_date THEN
    RETURN NEW;
  END IF;

  IF NEW.client_name IS NULL OR NEW.branch IS NULL
     OR NEW.sku IS NULL OR NEW.price_per_case IS NULL OR NEW.pricing_date IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE sales_transactions st
  SET amount = st.quantity * NEW.price_per_case
  FROM customers c
  WHERE st.customer_id        = c.id
    AND c.client_name         = NEW.client_name
    AND c.branch              = NEW.branch
    AND st.sku                = NEW.sku
    AND st.transaction_type   = 'sale'
    AND st.quantity           IS NOT NULL
    AND st.transaction_date::date >= NEW.pricing_date;

  PERFORM recalculate_outstanding_for_client(NEW.client_name, NEW.branch);

  RETURN NEW;
END;
$$;


-- Changes are grouped into:
--   1. Price corrections   (UPDATE — triggers auto-recalc of sales_transactions amounts)
--   2. Date corrections    (UPDATE pricing_date only; amounts unchanged when price is same)
--   3. Missing history     (INSERT historical pricing rows for existing clients)
--   4. New configs         (INSERT new client/SKU combinations)
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. PRICE CORRECTIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- Varsha grand Hotel: stored 96.60, should be 180.00 (15.00 × 12)
UPDATE public.customers
SET price_per_bottle = 15.00
WHERE client_name = 'Varsha grand Hotel'
  AND branch       = 'Bachupally'
  AND sku          = 'P 1000 ml';

-- Ballu Kitchen: price 165 → 164; date 2026-05-27 → 2026-05-01
UPDATE public.customers
SET price_per_bottle = ROUND((164.0 / 12)::numeric, 8),  -- ×12 = 164.00
    pricing_date     = '2026-05-01'
WHERE client_name = 'Ballu Kitchen'
  AND branch       = 'Kondapur'
  AND sku          = 'P 1000 ml';

-- Alley 91 P 250 ml (4/1/2025): was 165, should be 200 (6.6667 × 30)
UPDATE public.customers
SET price_per_bottle = ROUND((200.0 / 30)::numeric, 8)
WHERE client_name = 'Alley 91'
  AND branch       = 'Nanakramguda'
  AND sku          = 'P 250 ml'
  AND pricing_date = '2025-04-01';

-- Alley 91 P 500 ml (4/1/2025): was 170, should be 200 (10.00 × 20)
UPDATE public.customers
SET price_per_bottle = 10.00
WHERE client_name = 'Alley 91'
  AND branch       = 'Nanakramguda'
  AND sku          = 'P 500 ml'
  AND pricing_date = '2025-04-01';

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. DATE CORRECTIONS (price unchanged — trigger fires but amounts stay same)
-- ══════════════════════════════════════════════════════════════════════════════

-- Tonique P 1000 ml: effective from 4/1/2025, not 2026-01-21
UPDATE public.customers
SET pricing_date = '2025-04-01'
WHERE client_name = 'Tonique'
  AND branch       = 'Vijayawada'
  AND sku          = 'P 1000 ml'
  AND pricing_date = '2026-01-21';

-- This is it café P 500 ml: effective from 3/9/2026, not 5/1/2026
UPDATE public.customers
SET pricing_date = '2026-03-09'
WHERE client_name = 'This is it café'
  AND branch       = 'Sanikpuri'
  AND sku          = 'P 500 ml'
  AND pricing_date = '2026-05-01';

-- Aaha AL 500 ml: 105 price effective from 5/30/2025, not 2026-01-21
UPDATE public.customers
SET pricing_date = '2025-05-30'
WHERE client_name = 'Aaha'
  AND branch       = 'Khajaguda'
  AND sku          = 'AL 500 ml'
  AND pricing_date = '2026-01-21';

-- Maryadha Ramanna Kondapur: 170 was set 4/1/2025, not 2026-01-21
UPDATE public.customers
SET pricing_date = '2025-04-01'
WHERE client_name = 'Maryadha Ramanna'
  AND branch       = 'Kondapur'
  AND sku          = 'P 500 ml'
  AND pricing_date = '2026-01-21';

-- Tawalogy P 1000 ml: 174 was set 4/1/2025, not 2026-01-21
UPDATE public.customers
SET pricing_date = '2025-04-01'
WHERE client_name = 'Tawalogy'
  AND branch       = 'Gandipet'
  AND sku          = 'P 1000 ml'
  AND pricing_date = '2026-01-21';

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. MISSING HISTORICAL ENTRIES FOR EXISTING CLIENTS
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.customers (client_name, branch, sku, price_per_bottle, bottles_per_case, pricing_date, is_active)
VALUES

  -- ── Aaha: initial price 170 from 4/1/2025 (dropped to 105 on 5/30/2025) ──
  ('Aaha', 'Khajaguda', 'AL 500 ml', ROUND((170.0/12)::numeric,8), 12, '2025-04-01', true),

  -- ── Benguluru Bhavan: P 500 ml 170 and P 250 ml 180 from 4/1/2025 ─────────
  ('Benguluru Bhavan', 'Kondapur', 'P 500 ml', 8.50,  20, '2025-04-01', true),
  ('Benguluru Bhavan', 'Kondapur', 'P 250 ml', 6.00,  30, '2025-04-01', true),

  -- ── Gismat – Ameerpet (new branch): 166 → 170 → 190 ─────────────────────
  ('Gismat', 'Ameerpet',       'P 500 ml', 8.30, 20, '2025-04-01', true),
  ('Gismat', 'Ameerpet',       'P 500 ml', 8.50, 20, '2025-09-08', true),
  ('Gismat', 'Ameerpet',       'P 500 ml', 9.50, 20, '2026-03-09', true),

  -- ── Gismat – Chandha Nagar: 166 → 170 → 190 ─────────────────────────────
  ('Gismat', 'Chandha Nagar',  'P 500 ml', 8.30, 20, '2025-04-01', true),
  ('Gismat', 'Chandha Nagar',  'P 500 ml', 8.50, 20, '2025-09-08', true),
  ('Gismat', 'Chandha Nagar',  'P 500 ml', 9.50, 20, '2026-03-09', true),

  -- ── Gismat – Dilshuknagar (new branch): 166 → 170 → 190 ─────────────────
  ('Gismat', 'Dilshuknagar',   'P 500 ml', 8.30, 20, '2025-04-01', true),
  ('Gismat', 'Dilshuknagar',   'P 500 ml', 8.50, 20, '2025-09-08', true),
  ('Gismat', 'Dilshuknagar',   'P 500 ml', 9.50, 20, '2026-03-09', true),

  -- ── Gismat – Lakshmipuram: was 170 from start ────────────────────────────
  ('Gismat', 'Lakshmipuram',   'P 500 ml', 8.50, 20, '2025-04-01', true),
  ('Gismat', 'Lakshmipuram',   'P 500 ml', 8.50, 20, '2025-09-08', true),

  -- ── Gismat – Main office: 166 → 170 ─────────────────────────────────────
  ('Gismat', 'Main office',    'P 500 ml', 8.30, 20, '2025-04-01', true),
  ('Gismat', 'Main office',    'P 500 ml', 8.50, 20, '2025-09-08', true),

  -- ── Gismat – Pragathi nagar: 166 → 170 ──────────────────────────────────
  ('Gismat', 'Pragathi nagar', 'P 500 ml', 8.30, 20, '2025-04-01', true),
  ('Gismat', 'Pragathi nagar', 'P 500 ml', 8.50, 20, '2025-09-08', true),

  -- ── Gismat – Tenali: 166 → 170 ───────────────────────────────────────────
  ('Gismat', 'Tenali',         'P 500 ml', 8.30, 20, '2025-04-01', true),
  ('Gismat', 'Tenali',         'P 500 ml', 8.50, 20, '2025-09-08', true),

  -- ── Intercity: EL 500 ml history before the 2026-03-09 entry ────────────
  ('Intercity', 'Bachupally', 'EL 500 ml', 5.50, 20, '2025-04-01',  true),  -- 5.50×20=110
  ('Intercity', 'Bachupally', 'EL 500 ml', 5.90, 20, '2025-11-15',  true),  -- 5.90×20=118

  -- ── Jubile Festa inn: add P 500 ml and P 1000 ml from 4/1/2025 ───────────
  ('Jubile Festa inn', 'Jubilee Hills', 'P 500 ml',  9.00,  20, '2025-04-01', true),  -- 9×20=180
  ('Jubile Festa inn', 'Jubilee Hills', 'P 1000 ml', 14.50, 12, '2025-04-01', true),  -- 14.5×12=174

  -- ── Maryadha Ramanna: L B Nagar 170 from 4/1/2025, Kondapur 190 from 4/1/2026
  ('Maryadha Ramanna', 'L B Nagar', 'P 500 ml', 8.50, 20, '2025-04-01', true),  -- 8.5×20=170
  ('Maryadha Ramanna', 'Kondapur',  'P 500 ml', 9.50, 20, '2026-04-01', true),  -- 9.5×20=190

  -- ── Mid land: add P 1000 ml for Telangana at 186 from 4/1/2025 ───────────
  ('Mid land', 'Telangana', 'P 1000 ml', ROUND((186.0/12)::numeric,8), 12, '2025-04-01', true),

  -- ── Tara South Indian: 3/9/2026 price increase to 190 ───────────────────
  ('Tara South Indian', 'Hitech City', 'P 500 ml', 9.50, 20, '2026-03-09', true),  -- 9.5×20=190

  -- ── Tawalogy: P 250 ml from 12/1/2025, P 1000 ml 186 from 3/9/2026 ──────
  ('Tawalogy', 'Gandipet', 'P 250 ml',  5.00,                         30, '2025-12-01', true),  -- 5×30=150
  ('Tawalogy', 'Gandipet', 'P 1000 ml', ROUND((186.0/12)::numeric,8), 12, '2026-03-09', true),  -- ×12=186

  -- ── Alley 91: price updates at 4/25/2026 and 4/28/2026 ──────────────────
  ('Alley 91', 'Nanakramguda', 'P 500 ml', 8.50, 20, '2026-04-25', true),  -- 8.5×20=170
  ('Alley 91', 'Nanakramguda', 'P 250 ml', 5.50, 30, '2026-04-28', true);  -- 5.5×30=165

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. NEW CLIENT / SKU CONFIGS
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.customers (client_name, branch, sku, price_per_bottle, bottles_per_case, pricing_date, is_active)
VALUES
  -- Iguru (new client): 250 EC at 192.5 and P 500 ml at 170
  ('Iguru', '', '250 EC',   5.50, 35, '2025-04-01', true),   -- 5.5×35=192.5
  ('Iguru', '', 'P 500 ml', 8.50, 20, '2025-04-01', true);   -- 8.5×20=170
