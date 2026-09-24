-- Add all missing H:L label purchase/adjustment entries for active clients.
-- Each INSERT is guarded by WHERE NOT EXISTS to avoid duplicates.

-- 2024-12-09  Jubile Festa in 1000 ml  P 1000 ml  qty=6600  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jubile Festa in 1000 ml' LIMIT 1),
  'P 1000 ml',
  6600,
  0.0,
  0.0000,
  '2024-12-09',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2024-12-09'
    AND quantity = 6600
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jubile Festa in 1000 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2024-12-21  Jubile Festa in 500 ml  P 500 ml  qty=6300  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jubile Festa in 500 ml' LIMIT 1),
  'P 500 ml',
  6300,
  0.0,
  0.0000,
  '2024-12-21',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2024-12-21'
    AND quantity = 6300
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jubile Festa in 500 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2024-12-21  House party  P 500 ml  qty=1340  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'House party' LIMIT 1),
  'P 500 ml',
  1340,
  0.0,
  0.0000,
  '2024-12-21',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2024-12-21'
    AND quantity = 1340
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'House party' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-01-06  This is it café  P 500 ml  qty=740  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  740,
  0.0,
  0.0000,
  '2025-01-06',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-01-06'
    AND quantity = 740
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-01-11  Tilaks kitchen  P 500 ml  qty=16540  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Tilaks kitchen' LIMIT 1),
  'P 500 ml',
  16540,
  0.0,
  0.0000,
  '2025-01-11',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-01-11'
    AND quantity = 16540
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Tilaks kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-01-11  Element E7  P 1000 ml  qty=11100  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1),
  'P 1000 ml',
  11100,
  0.0,
  0.0000,
  '2025-01-11',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-01-11'
    AND quantity = 11100
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-01-11  Deccan kitchen 750 ml  AL 750 ml  qty=6064  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 750 ml' LIMIT 1),
  'AL 750 ml',
  6064,
  0.0,
  0.0000,
  '2025-01-11',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-01-11'
    AND quantity = 6064
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 750 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-04-26  House party  P 500 ml  qty=5400  amt=4860.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'House party' LIMIT 1),
  'P 500 ml',
  5400,
  0.9,
  4860.0000,
  '2025-04-26',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-04-26'
    AND quantity = 5400
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'House party' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-04-26  This is it café  P 500 ml  qty=10400  amt=8320.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  10400,
  0.8,
  8320.0000,
  '2025-04-26',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-04-26'
    AND quantity = 10400
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-04-28  Golden Pavilion  AL 750 ml  qty=720  amt=1152.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1),
  'AL 750 ml',
  720,
  1.6,
  1152.0000,
  '2025-04-28',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-04-28'
    AND quantity = 720
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-04-28  Good Vibes  P 500 ml  qty=625  amt=875.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Good Vibes' LIMIT 1),
  'P 500 ml',
  625,
  1.4,
  875.0000,
  '2025-04-28',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-04-28'
    AND quantity = 625
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Good Vibes' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-04-30  Golden Pavilion  AL 750 ml  qty=1056  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1),
  'AL 750 ml',
  1056,
  0.0,
  0.0000,
  '2025-04-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-04-30'
    AND quantity = 1056
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-05-01  Fusion Aroma  P 1000 ml  qty=228  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Fusion Aroma' LIMIT 1),
  'P 1000 ml',
  228,
  0.0,
  0.0000,
  '2025-05-01',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-05-01'
    AND quantity = 228
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Fusion Aroma' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-05-01  Biryanis and More  P 1000 ml  qty=600  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  600,
  0.0,
  0.0000,
  '2025-05-01',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-05-01'
    AND quantity = 600
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-10-05  Gismat  P 500 ml  qty=10550  amt=8440.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  10550,
  0.8,
  8440.0000,
  '2025-10-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-10-05'
    AND quantity = 10550
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-05-12  Deccan kitchen 250 ml  P 250 ml  qty=1500  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 250 ml' LIMIT 1),
  'P 250 ml',
  1500,
  0.0,
  0.0000,
  '2025-05-12',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-05-12'
    AND quantity = 1500
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 250 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-05-16  Biryanis and More  P 1000 ml  qty=10800  amt=10800.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  10800,
  1.0,
  10800.0000,
  '2025-05-16',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-05-16'
    AND quantity = 10800
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-05-16  Fusion Aroma  P 1000 ml  qty=5300  amt=6360.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Fusion Aroma' LIMIT 1),
  'P 1000 ml',
  5300,
  1.2,
  6360.0000,
  '2025-05-16',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-05-16'
    AND quantity = 5300
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Fusion Aroma' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-05-16  Atias Kitchen  P 1000 ml  qty=5400  amt=6480.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Atias Kitchen' LIMIT 1),
  'P 1000 ml',
  5400,
  1.2,
  6480.0000,
  '2025-05-16',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-05-16'
    AND quantity = 5400
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Atias Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-05-16  Deccan kitchen 750 ml  AL 750 ml  qty=5300  amt=6360.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 750 ml' LIMIT 1),
  'AL 750 ml',
  5300,
  1.2,
  6360.0000,
  '2025-05-16',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-05-16'
    AND quantity = 5300
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 750 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-05-20  AAHA  P 1000 ml  qty=11000  amt=8800.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'AAHA' LIMIT 1),
  'P 1000 ml',
  11000,
  0.8,
  8800.0000,
  '2025-05-20',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-05-20'
    AND quantity = 11000
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'AAHA' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-05-20  Gismat  P 500 ml  qty=16000  amt=12800.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  16000,
  0.8,
  12800.0000,
  '2025-05-20',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-05-20'
    AND quantity = 16000
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-05-20  Biryanis and More  P 1000 ml  qty=15900  amt=15900.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  15900,
  1.0,
  15900.0000,
  '2025-05-20',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-05-20'
    AND quantity = 15900
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-06-05  Benguluru Bhavan  P 500 ml  qty=880  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  880,
  0.0,
  0.0000,
  '2025-06-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-06-05'
    AND quantity = 880
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-06-05  Good Vibes  P 500 ml  qty=315  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Good Vibes' LIMIT 1),
  'P 500 ml',
  315,
  0.0,
  0.0000,
  '2025-06-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-06-05'
    AND quantity = 315
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Good Vibes' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-06-11  Tara South Indian  P 500 ml  qty=10300  amt=8240.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Tara South Indian' LIMIT 1),
  'P 500 ml',
  10300,
  0.8,
  8240.0000,
  '2025-06-11',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-06-11'
    AND quantity = 10300
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Tara South Indian' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-06-16  Gismat  P 500 ml  qty=12500  amt=10000.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  12500,
  0.8,
  10000.0000,
  '2025-06-16',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-06-16'
    AND quantity = 12500
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-06-25  Biryanis and More  P 1000 ml  qty=15500  amt=15500.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  15500,
  1.0,
  15500.0000,
  '2025-06-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-06-25'
    AND quantity = 15500
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-06-25  Benguluru Bhavan  P 500 ml  qty=17500  amt=14000.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  17500,
  0.8,
  14000.0000,
  '2025-06-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-06-25'
    AND quantity = 17500
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-06-25  Tilaks kitchen  P 500 ml  qty=10000  amt=8000.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Tilaks kitchen' LIMIT 1),
  'P 500 ml',
  10000,
  0.8,
  8000.0000,
  '2025-06-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-06-25'
    AND quantity = 10000
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Tilaks kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-06-30  Golden Pavilion  AL 750 ml  qty=2000  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1),
  'AL 750 ml',
  2000,
  0.0,
  0.0000,
  '2025-06-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-06-30'
    AND quantity = 2000
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-06-30  Good Vibes  P 500 ml  qty=2000  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Good Vibes' LIMIT 1),
  'P 500 ml',
  2000,
  0.0,
  0.0000,
  '2025-06-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-06-30'
    AND quantity = 2000
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Good Vibes' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-06-30  The English Café  P 1000 ml  qty=5000  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'The English Café' LIMIT 1),
  'P 1000 ml',
  5000,
  0.0,
  0.0000,
  '2025-06-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-06-30'
    AND quantity = 5000
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'The English Café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-06-30  Mid land 1000 ml  P 1000 ml  qty=768  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Mid land 1000 ml' LIMIT 1),
  'P 1000 ml',
  768,
  0.0,
  0.0000,
  '2025-06-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-06-30'
    AND quantity = 768
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Mid land 1000 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-06-30  Tonique  P 500 ml  qty=1932  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Tonique' LIMIT 1),
  'P 500 ml',
  1932,
  0.0,
  0.0000,
  '2025-06-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-06-30'
    AND quantity = 1932
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Tonique' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-06-30  Krigo  P 500 ml  qty=888  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Krigo' LIMIT 1),
  'P 500 ml',
  888,
  0.0,
  0.0000,
  '2025-06-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-06-30'
    AND quantity = 888
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Krigo' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-07-01  Gismat  P 500 ml  qty=21000  amt=16800.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  21000,
  0.8,
  16800.0000,
  '2025-07-01',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-07-01'
    AND quantity = 21000
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-07-12  Golden Pavilion  AL 750 ml  qty=2650  amt=2188.90  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1),
  'AL 750 ml',
  2650,
  0.826,
  2188.9000,
  '2025-07-12',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-07-12'
    AND quantity = 2650
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-07-12  Mid Land 750 ml  AL 750 ml  qty=2650  amt=2188.90  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Mid Land 750 ml' LIMIT 1),
  'AL 750 ml',
  2650,
  0.826,
  2188.9000,
  '2025-07-12',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-07-12'
    AND quantity = 2650
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Mid Land 750 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-07-12  Jagan pan house 1000 ml  P 1000 ml  qty=1350  amt=1911.60  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jagan pan house 1000 ml' LIMIT 1),
  'P 1000 ml',
  1350,
  1.416,
  1911.6000,
  '2025-07-12',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-07-12'
    AND quantity = 1350
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jagan pan house 1000 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-07-12  Jagan pan house 500 ml  P 500 ml  qty=1350  amt=1274.40  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jagan pan house 500 ml' LIMIT 1),
  'P 500 ml',
  1350,
  0.944,
  1274.4000,
  '2025-07-12',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-07-12'
    AND quantity = 1350
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jagan pan house 500 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-07-17  House party  P 500 ml  qty=6900  amt=5520.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'House party' LIMIT 1),
  'P 500 ml',
  6900,
  0.8,
  5520.0000,
  '2025-07-17',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-07-17'
    AND quantity = 6900
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'House party' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-07-17  Element E7  P 1000 ml  qty=12000  amt=12000.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1),
  'P 1000 ml',
  12000,
  1.0,
  12000.0000,
  '2025-07-17',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-07-17'
    AND quantity = 12000
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-07-22  Blossamin Spa  P 250 ml  qty=12000  amt=4800.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Blossamin Spa' LIMIT 1),
  'P 250 ml',
  12000,
  0.4,
  4800.0000,
  '2025-07-22',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-07-22'
    AND quantity = 12000
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Blossamin Spa' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-07-31  Mid Land 750 ml  AL 750 ml  qty=10017  amt=8274.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Mid Land 750 ml' LIMIT 1),
  'AL 750 ml',
  10017,
  0.825996,
  8274.0000,
  '2025-07-31',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-07-31'
    AND quantity = 10017
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Mid Land 750 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-07-31  Blossamin Spa  P 250 ml  qty=6100  amt=3959.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Blossamin Spa' LIMIT 1),
  'P 250 ml',
  6100,
  0.649016,
  3959.0000,
  '2025-07-31',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-07-31'
    AND quantity = 6100
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Blossamin Spa' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-08-01  Gismat  P 500 ml  qty=2500  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  2500,
  0.0,
  0.0000,
  '2025-08-01',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-08-01'
    AND quantity = 2500
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-08-02  Blossamin Spa  P 250 ml  qty=-12000  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Blossamin Spa' LIMIT 1),
  'P 250 ml',
  -12000,
  0.0,
  0.0000,
  '2025-08-02',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-08-02'
    AND quantity = -12000
    AND record_type = 'adjustment'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Blossamin Spa' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-08-04  Gismat  P 500 ml  qty=15700  amt=12560.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  15700,
  0.8,
  12560.0000,
  '2025-08-04',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-08-04'
    AND quantity = 15700
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-08-04  Maryadha Ramanna  P 500 ml  qty=10000  amt=8000.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1),
  'P 500 ml',
  10000,
  0.8,
  8000.0000,
  '2025-08-04',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-08-04'
    AND quantity = 10000
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-08-05  Chandhu Poda Marriage Order - 500 ml  P 500 ml  qty=7100  amt=4608.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chandhu Poda Marriage Order - 500 ml' LIMIT 1),
  'P 500 ml',
  7100,
  0.649014,
  4608.0000,
  '2025-08-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-08-05'
    AND quantity = 7100
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chandhu Poda Marriage Order - 500 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-08-19  Biryanis and More  P 1000 ml  qty=12700  amt=12700.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  12700,
  1.0,
  12700.0000,
  '2025-08-19',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-08-19'
    AND quantity = 12700
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-08-19  Gismat  P 500 ml  qty=13500  amt=10800.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  13500,
  0.8,
  10800.0000,
  '2025-08-19',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-08-19'
    AND quantity = 13500
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-08-19  Tilaks kitchen  P 500 ml  qty=12700  amt=10160.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Tilaks kitchen' LIMIT 1),
  'P 500 ml',
  12700,
  0.8,
  10160.0000,
  '2025-08-19',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-08-19'
    AND quantity = 12700
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Tilaks kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-08-31  This is it café  P 500 ml  qty=260  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  260,
  0.0,
  0.0000,
  '2025-08-31',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-08-31'
    AND quantity = 260
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-08-31  Deccan kitchen 250 ml  P 250 ml  qty=-300  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 250 ml' LIMIT 1),
  'P 250 ml',
  -300,
  0.0,
  0.0000,
  '2025-08-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-08-31'
    AND quantity = -300
    AND record_type = 'adjustment'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 250 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-08-31  Alley 91  P 500 ml  qty=2540  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1),
  'P 500 ml',
  2540,
  0.0,
  0.0000,
  '2025-08-31',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-08-31'
    AND quantity = 2540
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-09-03  This is it café  P 500 ml  qty=430  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  430,
  0.0,
  0.0000,
  '2025-09-03',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-09-03'
    AND quantity = 430
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-09-10  This is it café  P 500 ml  qty=11000  amt=8800.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  11000,
  0.8,
  8800.0000,
  '2025-09-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-09-10'
    AND quantity = 11000
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-09-10  Benguluru Bhavan  P 500 ml  qty=11000  amt=8800.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  11000,
  0.8,
  8800.0000,
  '2025-09-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-09-10'
    AND quantity = 11000
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-09-14  Mid Land 750 ml  AL 750 ml  qty=5100  amt=4212.60  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Mid Land 750 ml' LIMIT 1),
  'AL 750 ml',
  5100,
  0.826,
  4212.6000,
  '2025-09-14',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-09-14'
    AND quantity = 5100
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Mid Land 750 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-09-14  Chaitanya's Modern Kitchen  P 500 ml  qty=3960  amt=3270.96  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  3960,
  0.826,
  3270.9600,
  '2025-09-14',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-09-14'
    AND quantity = 3960
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-09-14  Golden Pavilion  AL 750 ml  qty=1900  amt=1569.40  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1),
  'AL 750 ml',
  1900,
  0.826,
  1569.4000,
  '2025-09-14',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-09-14'
    AND quantity = 1900
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-09-18  Deccan kitchen 250 ml  P 250 ml  qty=1250  amt=590.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 250 ml' LIMIT 1),
  'P 250 ml',
  1250,
  0.472,
  590.0000,
  '2025-09-18',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-09-18'
    AND quantity = 1250
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 250 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-09-18  Alley 91  P 500 ml  qty=1250  amt=1180.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1),
  'P 500 ml',
  1250,
  0.944,
  1180.0000,
  '2025-09-18',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-09-18'
    AND quantity = 1250
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-09-23  Gismat  P 500 ml  qty=10700  amt=8560.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  10700,
  0.8,
  8560.0000,
  '2025-09-23',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-09-23'
    AND quantity = 10700
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-09-30  Biryanis and More  P 1000 ml  qty=8688  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  8688,
  0.0,
  0.0000,
  '2025-09-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-09-30'
    AND quantity = 8688
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-09-30  Maryadha Ramanna  P 500 ml  qty=3820  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1),
  'P 500 ml',
  3820,
  0.0,
  0.0000,
  '2025-09-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-09-30'
    AND quantity = 3820
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-10-05  Chaitanya's Modern Kitchen  P 500 ml  qty=4020  amt=3794.88  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  4020,
  0.944,
  3794.8800,
  '2025-10-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-10-05'
    AND quantity = 4020
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-10-05  Alley 91  P 500 ml  qty=1500  amt=1416.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1),
  'P 500 ml',
  1500,
  0.944,
  1416.0000,
  '2025-10-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-10-05'
    AND quantity = 1500
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-10-06  Maryadha Ramanna  P 500 ml  qty=10000  amt=8000.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1),
  'P 500 ml',
  10000,
  0.8,
  8000.0000,
  '2025-10-06',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-10-06'
    AND quantity = 10000
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-10-13  Biryanis and More  P 1000 ml  qty=15300  amt=15300.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  15300,
  1.0,
  15300.0000,
  '2025-10-13',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-10-13'
    AND quantity = 15300
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-10-13  Gismat  P 500 ml  qty=14600  amt=11680.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  14600,
  0.8,
  11680.0000,
  '2025-10-13',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-10-13'
    AND quantity = 14600
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-10-13  House party  P 500 ml  qty=10000  amt=8000.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'House party' LIMIT 1),
  'P 500 ml',
  10000,
  0.8,
  8000.0000,
  '2025-10-13',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-10-13'
    AND quantity = 10000
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'House party' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-10-17  Golden Pavilion  AL 750 ml  qty=3660  amt=3023.16  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1),
  'AL 750 ml',
  3660,
  0.826,
  3023.1600,
  '2025-10-17',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-10-17'
    AND quantity = 3660
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-10-17  Chaitanya's Modern Kitchen  P 500 ml  qty=4550  amt=4295.20  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  4550,
  0.944,
  4295.2000,
  '2025-10-17',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-10-17'
    AND quantity = 4550
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-10-17  Chaitanya's Modern Kitchen  P 500 ml  qty=-4530  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  -4530,
  0.0,
  0.0000,
  '2025-10-17',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-10-17'
    AND quantity = -4530
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-10-25  Soul of South  P 500 ml  qty=1000  amt=1000.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1),
  'P 500 ml',
  1000,
  1.0,
  1000.0000,
  '2025-10-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-10-25'
    AND quantity = 1000
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-10-25  Gismat  P 500 ml  qty=21000  amt=16800.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  21000,
  0.8,
  16800.0000,
  '2025-10-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-10-25'
    AND quantity = 21000
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-10-25  Benguluru Bhavan  P 500 ml  qty=12300  amt=9840.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  12300,
  0.8,
  9840.0000,
  '2025-10-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-10-25'
    AND quantity = 12300
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-11-03  1980s Milatry Hotel  P 500 ml  qty=1302  amt=1075.45  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE '1980s Milatry Hotel' LIMIT 1),
  'P 500 ml',
  1302,
  0.826,
  1075.4520,
  '2025-11-03',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-11-03'
    AND quantity = 1302
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE '1980s Milatry Hotel' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-11-03  Deccan kitchen 750 ml  AL 750 ml  qty=1250  amt=1327.50  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 750 ml' LIMIT 1),
  'AL 750 ml',
  1250,
  1.062,
  1327.5000,
  '2025-11-03',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-11-03'
    AND quantity = 1250
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 750 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-11-03  Deccan kitchen 250 ml  P 250 ml  qty=1550  amt=731.60  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 250 ml' LIMIT 1),
  'P 250 ml',
  1550,
  0.472,
  731.6000,
  '2025-11-03',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-11-03'
    AND quantity = 1550
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Deccan kitchen 250 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-11-06  Maryadha Ramanna  P 500 ml  qty=-1000  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1),
  'P 500 ml',
  -1000,
  0.0,
  0.0000,
  '2025-11-06',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-11-06'
    AND quantity = -1000
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-11-18  Soul of South  P 500 ml  qty=2020  amt=1906.88  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1),
  'P 500 ml',
  2020,
  0.944,
  1906.8800,
  '2025-11-18',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-11-18'
    AND quantity = 2020
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-11-18  Alley 91  P 500 ml  qty=2520  amt=2378.88  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1),
  'P 500 ml',
  2520,
  0.944,
  2378.8800,
  '2025-11-18',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-11-18'
    AND quantity = 2520
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-12-06  Maryadha Ramanna  P 500 ml  qty=11000  amt=8800.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1),
  'P 500 ml',
  11000,
  0.8,
  8800.0000,
  '2025-12-06',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-06'
    AND quantity = 11000
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-12-06  Gismat  P 500 ml  qty=4050  amt=3823.20  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  4050,
  0.944,
  3823.2000,
  '2025-12-06',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-06'
    AND quantity = 4050
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-12-12  Gismat  P 500 ml  qty=8120  amt=7665.28  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  8120,
  0.944,
  7665.2800,
  '2025-12-12',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-12'
    AND quantity = 8120
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-12-12  Hiyya Chrono Jail Mandi  P 500 ml  qty=6169  amt=5823.54  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1),
  'P 500 ml',
  6169,
  0.944,
  5823.5360,
  '2025-12-12',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-12'
    AND quantity = 6169
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-12-21  1980s Milatry Hotel  P 500 ml  qty=1290  amt=1065.54  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE '1980s Milatry Hotel' LIMIT 1),
  'P 500 ml',
  1290,
  0.826,
  1065.5400,
  '2025-12-21',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-21'
    AND quantity = 1290
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE '1980s Milatry Hotel' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-12-21  Tawalogy  P 1000 ml  qty=2230  amt=3157.68  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Tawalogy' LIMIT 1),
  'P 1000 ml',
  2230,
  1.416,
  3157.6800,
  '2025-12-21',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-21'
    AND quantity = 2230
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Tawalogy' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-12-21  Hiyya Chrono Jail Mandi  P 500 ml  qty=4050  amt=3823.20  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1),
  'P 500 ml',
  4050,
  0.944,
  3823.2000,
  '2025-12-21',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-21'
    AND quantity = 4050
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-12-26  Chaitanya's Modern Kitchen  P 500 ml  qty=5886  amt=5556.38  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  5886,
  0.944,
  5556.3840,
  '2025-12-26',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-26'
    AND quantity = 5886
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-12-26  Tawalogy  P 1000 ml  qty=1212  amt=572.06  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Tawalogy' LIMIT 1),
  'P 1000 ml',
  1212,
  0.472,
  572.0640,
  '2025-12-26',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-26'
    AND quantity = 1212
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Tawalogy' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-12-26  Alley 91 - 250 ml  P 250 ml  qty=1255  amt=814.50  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91 - 250 ml' LIMIT 1),
  'P 250 ml',
  1255,
  0.649,
  814.4950,
  '2025-12-26',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-26'
    AND quantity = 1255
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91 - 250 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-12-26  Biryanis and More  P 1000 ml  qty=14500  amt=14500.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  14500,
  1.0,
  14500.0000,
  '2025-12-26',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-26'
    AND quantity = 14500
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-12-30  Benguluru Bhavan  P 500 ml  qty=12000  amt=9600.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  12000,
  0.8,
  9600.0000,
  '2025-12-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-30'
    AND quantity = 12000
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-12-31  Benguluru Bhavan  P 500 ml  qty=-2080  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  -2080,
  0.0,
  0.0000,
  '2025-12-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-31'
    AND quantity = -2080
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2025-12-31  Soul of South  P 500 ml  qty=40  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1),
  'P 500 ml',
  40,
  0.0,
  0.0000,
  '2025-12-31',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-31'
    AND quantity = 40
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-12-31  Alley 91  P 500 ml  qty=-470  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1),
  'P 500 ml',
  -470,
  0.0,
  0.0000,
  '2025-12-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-31'
    AND quantity = -470
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-12-31  Gismat  P 500 ml  qty=-11220  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  -11220,
  0.0,
  0.0000,
  '2025-12-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-31'
    AND quantity = -11220
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2025-12-31  Biryanis and More  P 1000 ml  qty=6000  amt=0.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  6000,
  0.0,
  0.0000,
  '2025-12-31',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-31'
    AND quantity = 6000
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2025-12-31  Element E7  P 1000 ml  qty=-1404  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1),
  'P 1000 ml',
  -1404,
  0.0,
  0.0000,
  '2025-12-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2025-12-31'
    AND quantity = -1404
    AND record_type = 'adjustment'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2026-01-05  Soul of South  P 500 ml  qty=1854  amt=1750.18  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1),
  'P 500 ml',
  1854,
  0.944,
  1750.1760,
  '2026-01-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-01-05'
    AND quantity = 1854
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-01-05  Gismat  P 500 ml  qty=1838  amt=1735.07  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  1838,
  0.944,
  1735.0720,
  '2026-01-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-01-05'
    AND quantity = 1838
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-01-05  This is it café  P 500 ml  qty=3225  amt=3044.40  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  3225,
  0.944,
  3044.4000,
  '2026-01-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-01-05'
    AND quantity = 3225
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-01-05  Alley 91  P 500 ml  qty=2645  amt=2496.88  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1),
  'P 500 ml',
  2645,
  0.944,
  2496.8800,
  '2026-01-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-01-05'
    AND quantity = 2645
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-01-05  Jismat  P 500 ml  qty=3532  amt=3334.21  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  3532,
  0.944,
  3334.2080,
  '2026-01-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-01-05'
    AND quantity = 3532
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-01-05  Happy Monkeys  P 500 ml  qty=1008  amt=1596.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Happy Monkeys' LIMIT 1),
  'P 500 ml',
  1008,
  1.583333,
  1596.0000,
  '2026-01-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-01-05'
    AND quantity = 1008
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Happy Monkeys' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2026-01-05  Biryanis and More  P 1000 ml  qty=2016  amt=3192.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  2016,
  1.583333,
  3192.0000,
  '2026-01-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-01-05'
    AND quantity = 2016
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2026-01-05  Gismat  P 500 ml  qty=155  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  155,
  0.0,
  0.0000,
  '2026-01-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-01-05'
    AND quantity = 155
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-01-13  Element E7  P 1000 ml  qty=3761  amt=5325.58  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1),
  'P 1000 ml',
  3761,
  1.416,
  5325.5760,
  '2026-01-13',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-01-13'
    AND quantity = 3761
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-01-13  Alley 91 - 250 ml  P 250 ml  qty=2091  amt=1357.06  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91 - 250 ml' LIMIT 1),
  'P 250 ml',
  2091,
  0.649,
  1357.0590,
  '2026-01-13',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-01-13'
    AND quantity = 2091
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91 - 250 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-01-13  Illuzion  P 500 ml  qty=2528  amt=2684.74  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion' LIMIT 1),
  'P 500 ml',
  2528,
  1.062,
  2684.7360,
  '2026-01-13',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-01-13'
    AND quantity = 2528
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-01-13  Jismat  P 500 ml  qty=9150  amt=8637.60  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  9150,
  0.944,
  8637.6000,
  '2026-01-13',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-01-13'
    AND quantity = 9150
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-01-13  Soul of South  P 500 ml  qty=2226  amt=2101.34  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1),
  'P 500 ml',
  2226,
  0.944,
  2101.3440,
  '2026-01-13',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-01-13'
    AND quantity = 2226
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-01-13  Gismat  P 500 ml  qty=3207  amt=3027.41  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  3207,
  0.944,
  3027.4080,
  '2026-01-13',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-01-13'
    AND quantity = 3207
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-01-13  Happy Monkeys  P 500 ml  qty=2113  amt=1994.67  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Happy Monkeys' LIMIT 1),
  'P 500 ml',
  2113,
  0.944,
  1994.6720,
  '2026-01-13',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-01-13'
    AND quantity = 2113
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Happy Monkeys' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-02  Hiyya Chrono Jail Mandi  P 500 ml  qty=4037  amt=3810.93  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1),
  'P 500 ml',
  4037,
  0.944,
  3810.9280,
  '2026-02-02',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-02'
    AND quantity = 4037
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-10  Gismat  P 500 ml  qty=200  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  200,
  0.0,
  0.0000,
  '2026-02-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-10'
    AND quantity = 200
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-10  Chaitanya's Modern Kitchen  P 500 ml  qty=14  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  14,
  0.0,
  0.0000,
  '2026-02-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-10'
    AND quantity = 14
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-14  Alley 91 - 250 ml  P 250 ml  qty=3558  amt=2309.14  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91 - 250 ml' LIMIT 1),
  'P 250 ml',
  3558,
  0.649,
  2309.1420,
  '2026-02-14',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-14'
    AND quantity = 3558
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91 - 250 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-14  Alley 91  P 500 ml  qty=2075  amt=1958.80  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1),
  'P 500 ml',
  2075,
  0.944,
  1958.8000,
  '2026-02-14',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-14'
    AND quantity = 2075
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-14  Golden Pavilion  AL 750 ml  qty=2067  amt=1707.34  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1),
  'AL 750 ml',
  2067,
  0.826,
  1707.3420,
  '2026-02-14',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-14'
    AND quantity = 2067
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-14  Gismat  P 500 ml  qty=4735  amt=4469.84  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  4735,
  0.944,
  4469.8400,
  '2026-02-14',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-14'
    AND quantity = 4735
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-14  Biryanis and More  P 1000 ml  qty=1244  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  1244,
  0.0,
  0.0000,
  '2026-02-14',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-14'
    AND quantity = 1244
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2026-02-20  Jismat  P 500 ml  qty=6113  amt=5769.97  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  6113,
  0.943885,
  5769.9720,
  '2026-02-20',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-20'
    AND quantity = 6113
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-20  Biryanis and More  P 1000 ml  qty=6110  amt=8651.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  6110,
  1.415876,
  8651.0000,
  '2026-02-20',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-20'
    AND quantity = 6110
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-20  Chaitanya's Modern Kitchen  P 500 ml  qty=4358  amt=4113.95  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  4358,
  0.944,
  4113.9520,
  '2026-02-20',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-20'
    AND quantity = 4358
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-20  This is it café  P 500 ml  qty=4169  amt=3935.54  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  4169,
  0.944,
  3935.5360,
  '2026-02-20',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-20'
    AND quantity = 4169
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-23  Hiyya Chrono Jail Mandi  P 500 ml  qty=4188  amt=3953.47  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1),
  'P 500 ml',
  4188,
  0.944,
  3953.4720,
  '2026-02-23',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-23'
    AND quantity = 4188
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-23  Benguluru Bhavan  P 500 ml  qty=4490  amt=4238.56  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  4490,
  0.944,
  4238.5600,
  '2026-02-23',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-23'
    AND quantity = 4490
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-28  Element E7  P 1000 ml  qty=-89  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1),
  'P 1000 ml',
  -89,
  0.0,
  0.0000,
  '2026-02-28',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-28'
    AND quantity = -89
    AND record_type = 'adjustment'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-28  Jismat  P 500 ml  qty=305  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  305,
  0.0,
  0.0000,
  '2026-02-28',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-28'
    AND quantity = 305
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-02-28  Gismat  P 500 ml  qty=-95  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  -95,
  0.0,
  0.0000,
  '2026-02-28',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-02-28'
    AND quantity = -95
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-19  Gismat  P 500 ml  qty=4094  amt=3864.74  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  4094,
  0.944,
  3864.7360,
  '2026-03-19',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-19'
    AND quantity = 4094
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-19  Jismat  P 500 ml  qty=6094  amt=5752.74  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  6094,
  0.944,
  5752.7360,
  '2026-03-19',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-19'
    AND quantity = 6094
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-19  Element E7  P 1000 ml  qty=2523  amt=3571.81  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1),
  'P 1000 ml',
  2523,
  1.415699,
  3571.8080,
  '2026-03-19',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-19'
    AND quantity = 2523
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-19  Biryanis and More  P 1000 ml  qty=6919  amt=9796.54  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  6919,
  1.41589,
  9796.5440,
  '2026-03-19',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-19'
    AND quantity = 6919
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-19  Soul of South  P 500 ml  qty=2108  amt=1989.95  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1),
  'P 500 ml',
  2108,
  0.944,
  1989.9520,
  '2026-03-19',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-19'
    AND quantity = 2108
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-22  Biryanis and More  P 1000 ml  qty=2451  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  2451,
  0.0,
  0.0000,
  '2026-03-22',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-22'
    AND quantity = 2451
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-22  Chaitanya's Modern Kitchen  P 500 ml  qty=-318  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  -318,
  0.0,
  0.0000,
  '2026-03-22',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-22'
    AND quantity = -318
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-22  Tara South Indian  P 500 ml  qty=-720  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Tara South Indian' LIMIT 1),
  'P 500 ml',
  -720,
  0.0,
  0.0000,
  '2026-03-22',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-22'
    AND quantity = -720
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Tara South Indian' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2026-03-30  Tara South Indian  P 500 ml  qty=3188  amt=3009.47  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Tara South Indian' LIMIT 1),
  'P 500 ml',
  3188,
  0.944,
  3009.4720,
  '2026-03-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-30'
    AND quantity = 3188
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Tara South Indian' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-30  Chaitanya's Modern Kitchen  P 500 ml  qty=4094  amt=3864.74  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  4094,
  0.944,
  3864.7360,
  '2026-03-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-30'
    AND quantity = 4094
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-30  Gismat  P 500 ml  qty=4018  amt=3792.99  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  4018,
  0.944,
  3792.9920,
  '2026-03-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-30'
    AND quantity = 4018
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-30  Biryanis and More  P 1000 ml  qty=7158  amt=10135.73  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  7158,
  1.416,
  10135.7280,
  '2026-03-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-30'
    AND quantity = 7158
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-30  Element E7  P 1000 ml  qty=1349  amt=1910.18  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1),
  'P 1000 ml',
  1349,
  1.416,
  1910.1840,
  '2026-03-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-30'
    AND quantity = 1349
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-31  Jismat  P 500 ml  qty=306  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  306,
  0.0,
  0.0000,
  '2026-03-31',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-31'
    AND quantity = 306
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-31  Chaitanya's Modern Kitchen  P 500 ml  qty=-94  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  -94,
  0.0,
  0.0000,
  '2026-03-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-31'
    AND quantity = -94
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-31  Alley 91  P 500 ml  qty=-940  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1),
  'P 500 ml',
  -940,
  0.0,
  0.0000,
  '2026-03-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-31'
    AND quantity = -940
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-31  Alley 91 - 250 ml  P 250 ml  qty=-2049  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91 - 250 ml' LIMIT 1),
  'P 250 ml',
  -2049,
  0.0,
  0.0000,
  '2026-03-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-31'
    AND quantity = -2049
    AND record_type = 'adjustment'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91 - 250 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-31  AAHA  P 1000 ml  qty=1130  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'AAHA' LIMIT 1),
  'P 1000 ml',
  1130,
  0.0,
  0.0000,
  '2026-03-31',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-31'
    AND quantity = 1130
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'AAHA' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='gmg labels' LIMIT 1)
);

-- 2026-03-31  Tara South Indian  P 500 ml  qty=-88  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Tara South Indian' LIMIT 1),
  'P 500 ml',
  -88,
  0.0,
  0.0000,
  '2026-03-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-31'
    AND quantity = -88
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Tara South Indian' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-31  This is it café  P 500 ml  qty=616  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  616,
  0.0,
  0.0000,
  '2026-03-31',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-31'
    AND quantity = 616
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-31  Benguluru Bhavan  P 500 ml  qty=-239  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  -239,
  0.0,
  0.0000,
  '2026-03-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-31'
    AND quantity = -239
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-31  Gismat  P 500 ml  qty=-562  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  -562,
  0.0,
  0.0000,
  '2026-03-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-31'
    AND quantity = -562
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-31  Soul of South  P 500 ml  qty=-388  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1),
  'P 500 ml',
  -388,
  0.0,
  0.0000,
  '2026-03-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-31'
    AND quantity = -388
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-31  Illuzion  P 500 ml  qty=512  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion' LIMIT 1),
  'P 500 ml',
  512,
  0.0,
  0.0000,
  '2026-03-31',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-31'
    AND quantity = 512
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-31  Biryanis and More  P 1000 ml  qty=-78  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  -78,
  0.0,
  0.0000,
  '2026-03-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-31'
    AND quantity = -78
    AND record_type = 'adjustment'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-03-31  Maryadha Ramanna  P 500 ml  qty=-3240  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1),
  'P 500 ml',
  -3240,
  0.0,
  0.0000,
  '2026-03-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-03-31'
    AND quantity = -3240
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-10  Jismat  P 500 ml  qty=4188  amt=3953.47  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  4188,
  0.944,
  3953.4720,
  '2026-04-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-10'
    AND quantity = 4188
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-11  Iron hill café  P 500 ml  qty=800  amt=1500.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1),
  'P 500 ml',
  800,
  1.875,
  1500.0000,
  '2026-04-11',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-11'
    AND quantity = 800
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1)
);

-- 2026-04-14  Iron hill café  P 500 ml  qty=2188  amt=2065.47  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1),
  'P 500 ml',
  2188,
  0.944,
  2065.4720,
  '2026-04-14',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-14'
    AND quantity = 2188
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-14  Thatha Kottu Tiffins  P 500 ml  qty=2132  amt=2012.61  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1),
  'P 500 ml',
  2132,
  0.944,
  2012.6080,
  '2026-04-14',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-14'
    AND quantity = 2132
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-14  Golden Pavilion  AL 750 ml  qty=2223  amt=1836.20  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1),
  'AL 750 ml',
  2223,
  0.826,
  1836.1980,
  '2026-04-14',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-14'
    AND quantity = 2223
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-15  Element E7  P 1000 ml  qty=2571  amt=3640.54  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1),
  'P 1000 ml',
  2571,
  1.416,
  3640.5360,
  '2026-04-15',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-15'
    AND quantity = 2571
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-15  Jismat  P 500 ml  qty=4584  amt=4327.30  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  4584,
  0.944,
  4327.2960,
  '2026-04-15',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-15'
    AND quantity = 4584
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-15  Gismat  P 500 ml  qty=2150  amt=2029.60  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  2150,
  0.944,
  2029.6000,
  '2026-04-15',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-15'
    AND quantity = 2150
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-15  Benguluru Bhavan  P 500 ml  qty=3169  amt=2991.54  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  3169,
  0.944,
  2991.5360,
  '2026-04-15',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-15'
    AND quantity = 3169
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-18  Hiyya Chrono Jail Mandi  P 500 ml  qty=3169  amt=2991.54  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1),
  'P 500 ml',
  3169,
  0.944,
  2991.5360,
  '2026-04-18',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-18'
    AND quantity = 3169
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-18  This is it café  P 500 ml  qty=2075  amt=1958.80  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  2075,
  0.944,
  1958.8000,
  '2026-04-18',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-18'
    AND quantity = 2075
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-18  Angana Caters  P 250 ml  qty=5116  amt=3320.28  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Angana Caters' LIMIT 1),
  'P 250 ml',
  5116,
  0.649,
  3320.2840,
  '2026-04-18',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-18'
    AND quantity = 5116
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Angana Caters' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-18  First Cut  P 250 ml  qty=5116  amt=3320.28  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'First Cut' LIMIT 1),
  'P 250 ml',
  5116,
  0.649,
  3320.2840,
  '2026-04-18',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-18'
    AND quantity = 5116
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'First Cut' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-28  Iron hill café  P 500 ml  qty=3150  amt=2973.60  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1),
  'P 500 ml',
  3150,
  0.944,
  2973.6000,
  '2026-04-28',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-28'
    AND quantity = 3150
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-28  Soul of South  P 500 ml  qty=2094  amt=1976.74  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1),
  'P 500 ml',
  2094,
  0.944,
  1976.7360,
  '2026-04-28',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-28'
    AND quantity = 2094
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-28  Gismat  P 500 ml  qty=4169  amt=3935.54  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  4169,
  0.944,
  3935.5360,
  '2026-04-28',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-28'
    AND quantity = 4169
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-28  Maryadha Ramanna  P 500 ml  qty=2094  amt=1976.74  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1),
  'P 500 ml',
  2094,
  0.944,
  1976.7360,
  '2026-04-28',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-28'
    AND quantity = 2094
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-28  Benguluru Bhavan  P 500 ml  qty=4150  amt=3917.60  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  4150,
  0.944,
  3917.6000,
  '2026-04-28',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-28'
    AND quantity = 4150
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-28  Biryanis and More  P 1000 ml  qty=6237  amt=8831.59  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  6237,
  1.416,
  8831.5920,
  '2026-04-28',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-28'
    AND quantity = 6237
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-28  Chaitanya's Modern Kitchen  P 500 ml  qty=4113  amt=3882.67  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  4113,
  0.944,
  3882.6720,
  '2026-04-28',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-28'
    AND quantity = 4113
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-30  Gismat  P 500 ml  qty=2471  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  2471,
  0.0,
  0.0000,
  '2026-04-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-30'
    AND quantity = 2471
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-30  Illuzion  P 500 ml  qty=1080  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion' LIMIT 1),
  'P 500 ml',
  1080,
  0.0,
  0.0000,
  '2026-04-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-30'
    AND quantity = 1080
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-04-30  Chaitanya's Modern Kitchen  P 500 ml  qty=47  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  47,
  0.0,
  0.0000,
  '2026-04-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-04-30'
    AND quantity = 47
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-05  Alley 91  P 500 ml  qty=3056  amt=2884.86  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1),
  'P 500 ml',
  3056,
  0.944,
  2884.8640,
  '2026-05-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-05'
    AND quantity = 3056
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-05  Alley 91 - 250 ml  P 250 ml  qty=5208  amt=3379.99  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91 - 250 ml' LIMIT 1),
  'P 250 ml',
  5208,
  0.649,
  3379.9920,
  '2026-05-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-05'
    AND quantity = 5208
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91 - 250 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-05  Angana Caters  P 250 ml  qty=3627  amt=2353.92  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Angana Caters' LIMIT 1),
  'P 250 ml',
  3627,
  0.649,
  2353.9230,
  '2026-05-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-05'
    AND quantity = 3627
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Angana Caters' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-06  Hiyya Dino Mandi  P 500 ml  qty=800  amt=1800.00  vendor=NULL...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1),
  'P 500 ml',
  800,
  2.25,
  1800.0000,
  '2026-05-06',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-06'
    AND quantity = 800
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM NULL
);

-- 2026-05-08  Hiyya Dino Mandi  P 500 ml  qty=4030  amt=3804.32  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1),
  'P 500 ml',
  4030,
  0.944,
  3804.3200,
  '2026-05-08',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-08'
    AND quantity = 4030
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-08  Thatha Kottu Tiffins  P 500 ml  qty=2090  amt=1972.96  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1),
  'P 500 ml',
  2090,
  0.944,
  1972.9600,
  '2026-05-08',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-08'
    AND quantity = 2090
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-16  Element E7  P 1000 ml  qty=2492  amt=3528.67  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1),
  'P 1000 ml',
  2492,
  1.416,
  3528.6720,
  '2026-05-16',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-16'
    AND quantity = 2492
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-16  Benguluru Bhavan  P 500 ml  qty=4150  amt=3917.60  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  4150,
  0.944,
  3917.6000,
  '2026-05-16',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-16'
    AND quantity = 4150
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-16  Soul of South  P 500 ml  qty=3584  amt=3383.30  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1),
  'P 500 ml',
  3584,
  0.944,
  3383.2960,
  '2026-05-16',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-16'
    AND quantity = 3584
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-16  Tawalogy  P 1000 ml  qty=1400  amt=1982.40  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Tawalogy' LIMIT 1),
  'P 1000 ml',
  1400,
  1.416,
  1982.4000,
  '2026-05-16',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-16'
    AND quantity = 1400
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Tawalogy' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-16  Biryanis and More  P 1000 ml  qty=4189  amt=5931.62  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  4189,
  1.416,
  5931.6240,
  '2026-05-16',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-16'
    AND quantity = 4189
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-16  Gismat  P 500 ml  qty=3150  amt=2973.60  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  3150,
  0.944,
  2973.6000,
  '2026-05-16',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-16'
    AND quantity = 3150
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-16  This is it café  P 500 ml  qty=2100  amt=1982.40  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  2100,
  0.944,
  1982.4000,
  '2026-05-16',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-16'
    AND quantity = 2100
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-19  Hiyya Dino Mandi  P 500 ml  qty=4150  amt=3917.60  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1),
  'P 500 ml',
  4150,
  0.944,
  3917.6000,
  '2026-05-19',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-19'
    AND quantity = 4150
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-19  Hiyya Chrono Jail Mandi  P 500 ml  qty=3188  amt=3009.47  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1),
  'P 500 ml',
  3188,
  0.944,
  3009.4720,
  '2026-05-19',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-19'
    AND quantity = 3188
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-19  Jismat  P 500 ml  qty=5471  amt=5164.62  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  5471,
  0.944,
  5164.6240,
  '2026-05-19',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-19'
    AND quantity = 5471
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-19  Maryadha Ramanna  P 500 ml  qty=5169  amt=4879.54  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1),
  'P 500 ml',
  5169,
  0.944,
  4879.5360,
  '2026-05-19',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-19'
    AND quantity = 5169
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-25  Thatha Kottu Tiffins  P 500 ml  qty=2169  amt=2047.54  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1),
  'P 500 ml',
  2169,
  0.944,
  2047.5360,
  '2026-05-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-25'
    AND quantity = 2169
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-25  Gismat  P 500 ml  qty=4169  amt=3935.54  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  4169,
  0.944,
  3935.5360,
  '2026-05-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-25'
    AND quantity = 4169
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-25  Chaitanya's Modern Kitchen  P 500 ml  qty=4169  amt=3935.54  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  4169,
  0.944,
  3935.5360,
  '2026-05-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-25'
    AND quantity = 4169
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-25  Illuzion  P 500 ml  qty=2490  amt=2644.38  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion' LIMIT 1),
  'P 500 ml',
  2490,
  1.062,
  2644.3800,
  '2026-05-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-25'
    AND quantity = 2490
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-31  Hiyya Dino Mandi  P 500 ml  qty=-80  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1),
  'P 500 ml',
  -80,
  0.0,
  0.0000,
  '2026-05-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-31'
    AND quantity = -80
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-31  Hiyya Chrono Jail Mandi  P 500 ml  qty=-921  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1),
  'P 500 ml',
  -921,
  0.0,
  0.0000,
  '2026-05-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-31'
    AND quantity = -921
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-31  Benguluru Bhavan  P 500 ml  qty=-800  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  -800,
  0.0,
  0.0000,
  '2026-05-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-31'
    AND quantity = -800
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-05-31  Ballu Kitchen  P 1000 ml  qty=42  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballu Kitchen' LIMIT 1),
  'P 1000 ml',
  42,
  0.0,
  0.0000,
  '2026-05-31',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-05-31'
    AND quantity = 42
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballu Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-04  Iron hill café  P 500 ml  qty=2169  amt=2047.54  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1),
  'P 500 ml',
  2169,
  0.944,
  2047.5360,
  '2026-06-04',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-04'
    AND quantity = 2169
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-04  Maryadha Ramanna  P 500 ml  qty=2264  amt=2137.22  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1),
  'P 500 ml',
  2264,
  0.944,
  2137.2160,
  '2026-06-04',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-04'
    AND quantity = 2264
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-04  This is it café  P 500 ml  qty=2188  amt=2065.47  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  2188,
  0.944,
  2065.4720,
  '2026-06-04',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-04'
    AND quantity = 2188
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-04  Ballu Kitchen  P 1000 ml  qty=2634  amt=3729.74  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballu Kitchen' LIMIT 1),
  'P 1000 ml',
  2634,
  1.416,
  3729.7440,
  '2026-06-04',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-04'
    AND quantity = 2634
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballu Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-10  Hiyya Dino Mandi  P 500 ml  qty=4150  amt=3917.60  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1),
  'P 500 ml',
  4150,
  0.944,
  3917.6000,
  '2026-06-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-10'
    AND quantity = 4150
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-10  Hiyya Chrono Jail Mandi  P 500 ml  qty=2113  amt=1994.67  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1),
  'P 500 ml',
  2113,
  0.944,
  1994.6720,
  '2026-06-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-10'
    AND quantity = 2113
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-10  Benguluru Bhavan  P 500 ml  qty=4150  amt=3917.60  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  4150,
  0.944,
  3917.6000,
  '2026-06-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-10'
    AND quantity = 4150
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-10  Jismat  P 500 ml  qty=4075  amt=3846.80  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  4075,
  0.944,
  3846.8000,
  '2026-06-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-10'
    AND quantity = 4075
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-10  Biryanis and More  P 1000 ml  qty=4142  amt=5865.07  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  4142,
  1.416,
  5865.0720,
  '2026-06-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-10'
    AND quantity = 4142
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-14  Sri Sri group  P 1000 ml  qty=2650  amt=3752.40  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri group' LIMIT 1),
  'P 1000 ml',
  2650,
  1.416,
  3752.4000,
  '2026-06-14',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-14'
    AND quantity = 2650
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri group' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-14  Sri Sri group  P 500 ml  qty=4301  amt=4060.14  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri group' LIMIT 1),
  'P 500 ml',
  4301,
  0.944,
  4060.1440,
  '2026-06-14',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-14'
    AND quantity = 4301
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri group' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-14  Ballu Kitchen  P 1000 ml  qty=2666  amt=3775.06  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballu Kitchen' LIMIT 1),
  'P 1000 ml',
  2666,
  1.416,
  3775.0560,
  '2026-06-14',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-14'
    AND quantity = 2666
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballu Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-14  Hiyya Chrono Jail Mandi  P 500 ml  qty=2132  amt=2012.61  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1),
  'P 500 ml',
  2132,
  0.944,
  2012.6080,
  '2026-06-14',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-14'
    AND quantity = 2132
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-18  Biryanis and More  P 1000 ml  qty=4126  amt=5842.42  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  4126,
  1.416,
  5842.4160,
  '2026-06-18',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-18'
    AND quantity = 4126
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-18  Chandhu Poda Marriage Order - 500 ml  P 500 ml  qty=2849  amt=2689.46  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chandhu Poda Marriage Order - 500 ml' LIMIT 1),
  'P 500 ml',
  2849,
  0.944,
  2689.4560,
  '2026-06-18',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-18'
    AND quantity = 2849
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chandhu Poda Marriage Order - 500 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-18  Soul of South  P 500 ml  qty=2132  amt=2012.61  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1),
  'P 500 ml',
  2132,
  0.944,
  2012.6080,
  '2026-06-18',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-18'
    AND quantity = 2132
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-25  Gismat  P 500 ml  qty=-19  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  -19,
  0.0,
  0.0000,
  '2026-06-25',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-25'
    AND quantity = -19
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-25  Hiyya Dino Mandi  P 500 ml  qty=100  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1),
  'P 500 ml',
  100,
  0.0,
  0.0000,
  '2026-06-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-25'
    AND quantity = 100
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-25  Hiyya Chrono Jail Mandi  P 500 ml  qty=588  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1),
  'P 500 ml',
  588,
  0.0,
  0.0000,
  '2026-06-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-25'
    AND quantity = 588
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-25  Benguluru Bhavan  P 500 ml  qty=-180  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  -180,
  0.0,
  0.0000,
  '2026-06-25',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-25'
    AND quantity = -180
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-25  Soul of South  P 500 ml  qty=-430  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1),
  'P 500 ml',
  -430,
  0.0,
  0.0000,
  '2026-06-25',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-25'
    AND quantity = -430
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-25  Thatha Kottu Tiffins  P 500 ml  qty=9  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1),
  'P 500 ml',
  9,
  0.0,
  0.0000,
  '2026-06-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-25'
    AND quantity = 9
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-25  Chaitanya's Modern Kitchen  P 500 ml  qty=31  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  31,
  0.0,
  0.0000,
  '2026-06-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-25'
    AND quantity = 31
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-25  Chandhu Poda Marriage Order - 500 ml  P 500 ml  qty=211  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chandhu Poda Marriage Order - 500 ml' LIMIT 1),
  'P 500 ml',
  211,
  0.0,
  0.0000,
  '2026-06-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-25'
    AND quantity = 211
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chandhu Poda Marriage Order - 500 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-30  Benguluru Bhavan  P 500 ml  qty=2080  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  2080,
  0.0,
  0.0000,
  '2026-06-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-30'
    AND quantity = 2080
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-06-30  Chaitanya's Modern Kitchen  P 500 ml  qty=40  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  40,
  0.0,
  0.0000,
  '2026-06-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-30'
    AND quantity = 40
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-01  Gismat  P 500 ml  qty=3075  amt=2902.80  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  3075,
  0.944,
  2902.8000,
  '2026-07-01',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-01'
    AND quantity = 3075
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-01  Sri Sri group  P 500 ml  qty=4075  amt=3846.80  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri group' LIMIT 1),
  'P 500 ml',
  4075,
  0.944,
  3846.8000,
  '2026-07-01',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-01'
    AND quantity = 4075
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Sri Sri group' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-01  Hiyya Chrono Jail Mandi  P 500 ml  qty=3113  amt=2938.67  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1),
  'P 500 ml',
  3113,
  0.944,
  2938.6720,
  '2026-07-01',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-01'
    AND quantity = 3113
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-01  Soul of South  P 500 ml  qty=4943  amt=4666.19  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1),
  'P 500 ml',
  4943,
  0.944,
  4666.1920,
  '2026-07-01',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-01'
    AND quantity = 4943
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-03  Jismat  P 500 ml  qty=4074  amt=3845.86  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  4074,
  0.944,
  3845.8560,
  '2026-07-03',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-03'
    AND quantity = 4074
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-03  Chaitanya's Modern Kitchen  P 500 ml  qty=4169  amt=3935.54  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  4169,
  0.944,
  3935.5360,
  '2026-07-03',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-03'
    AND quantity = 4169
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-03  Thatha Kottu Tiffins  P 500 ml  qty=2075  amt=1958.80  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1),
  'P 500 ml',
  2075,
  0.944,
  1958.8000,
  '2026-07-03',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-03'
    AND quantity = 2075
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-03  Hiyya Dino Mandi  P 500 ml  qty=4094  amt=3864.74  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1),
  'P 500 ml',
  4094,
  0.944,
  3864.7360,
  '2026-07-03',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-03'
    AND quantity = 4094
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-03  Maryadha Ramanna  P 500 ml  qty=2075  amt=1958.80  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1),
  'P 500 ml',
  2075,
  0.944,
  1958.8000,
  '2026-07-03',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-03'
    AND quantity = 2075
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-08  Element E7  P 1000 ml  qty=-247  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1),
  'P 1000 ml',
  -247,
  0.0,
  0.0000,
  '2026-07-08',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-08'
    AND quantity = -247
    AND record_type = 'adjustment'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-08  Gismat  P 500 ml  qty=25  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  25,
  0.0,
  0.0000,
  '2026-07-08',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-08'
    AND quantity = 25
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-08  Iron hill café  P 500 ml  qty=-347  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1),
  'P 500 ml',
  -347,
  0.0,
  0.0000,
  '2026-07-08',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-08'
    AND quantity = -347
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-08  This is it café  P 500 ml  qty=-623  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  -623,
  0.0,
  0.0000,
  '2026-07-08',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-08'
    AND quantity = -623
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-08  Golden Pavilion  AL 750 ml  qty=-1929  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1),
  'AL 750 ml',
  -1929,
  0.0,
  0.0000,
  '2026-07-08',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-08'
    AND quantity = -1929
    AND record_type = 'adjustment'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-08  Illuzion  P 500 ml  qty=1150  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion' LIMIT 1),
  'P 500 ml',
  1150,
  0.0,
  0.0000,
  '2026-07-08',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-08'
    AND quantity = 1150
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-08  Golden Pavilion  AL 750 ml  qty=2532  amt=2091.43  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1),
  'AL 750 ml',
  2532,
  0.826,
  2091.4320,
  '2026-07-08',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-08'
    AND quantity = 2532
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-08  Benguluru Bhavan  P 500 ml  qty=4056  amt=3828.86  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  4056,
  0.944,
  3828.8640,
  '2026-07-08',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-08'
    AND quantity = 4056
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-08  This is it café  P 500 ml  qty=3113  amt=2938.67  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  3113,
  0.944,
  2938.6720,
  '2026-07-08',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-08'
    AND quantity = 3113
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-08  Iron hill café  P 500 ml  qty=2037  amt=1922.93  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1),
  'P 500 ml',
  2037,
  0.944,
  1922.9280,
  '2026-07-08',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-08'
    AND quantity = 2037
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-08  Element E7  P 1000 ml  qty=2507  amt=3549.91  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1),
  'P 1000 ml',
  2507,
  1.416,
  3549.9120,
  '2026-07-08',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-08'
    AND quantity = 2507
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-08  Biryanis and More  P 1000 ml  qty=4935  amt=6987.96  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  4935,
  1.416,
  6987.9600,
  '2026-07-08',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-08'
    AND quantity = 4935
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-16  Golden Pavilion  AL 750 ml  qty=2586  amt=2136.04  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1),
  'AL 750 ml',
  2586,
  0.826,
  2136.0360,
  '2026-07-16',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-16'
    AND quantity = 2586
    AND record_type = 'purchase'
    AND sku = 'AL 750 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Golden Pavilion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-16  Gismat  P 500 ml  qty=5207  amt=4915.41  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  5207,
  0.944,
  4915.4080,
  '2026-07-16',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-16'
    AND quantity = 5207
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-16  Hiyya Dino Mandi  P 500 ml  qty=-244  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1),
  'P 500 ml',
  -244,
  0.0,
  0.0000,
  '2026-07-16',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-16'
    AND quantity = -244
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-18  Iron hill café  P 500 ml  qty=43  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1),
  'P 500 ml',
  43,
  0.0,
  0.0000,
  '2026-07-18',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-18'
    AND quantity = 43
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-18  Thatha Kottu Tiffins  P 500 ml  qty=-575  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1),
  'P 500 ml',
  -575,
  0.0,
  0.0000,
  '2026-07-18',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-18'
    AND quantity = -575
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-20  Iron hill café  P 500 ml  qty=2075  amt=1958.80  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1),
  'P 500 ml',
  2075,
  0.944,
  1958.8000,
  '2026-07-20',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-20'
    AND quantity = 2075
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-20  Illuzion  P 500 ml  qty=2640  amt=2492.16  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion' LIMIT 1),
  'P 500 ml',
  2640,
  0.944,
  2492.1600,
  '2026-07-20',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-20'
    AND quantity = 2640
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-20  Biryanis and More  P 1000 ml  qty=4126  amt=5842.42  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  4126,
  1.416,
  5842.4160,
  '2026-07-20',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-20'
    AND quantity = 4126
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-21  Hiyya Dino Mandi  P 500 ml  qty=4150  amt=3917.60  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1),
  'P 500 ml',
  4150,
  0.944,
  3917.6000,
  '2026-07-21',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-21'
    AND quantity = 4150
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-21  Hiyya Chrono Jail Mandi  P 500 ml  qty=3924  amt=3704.26  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1),
  'P 500 ml',
  3924,
  0.944,
  3704.2560,
  '2026-07-21',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-21'
    AND quantity = 3924
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-21  Twilight Embassy  P 500 ml  qty=1207  amt=1139.41  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Twilight Embassy' LIMIT 1),
  'P 500 ml',
  1207,
  0.944,
  1139.4080,
  '2026-07-21',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-21'
    AND quantity = 1207
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Twilight Embassy' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-21  SSKL  P 250 ml  qty=5018  amt=2368.50  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'SSKL' LIMIT 1),
  'P 250 ml',
  5018,
  0.472,
  2368.4960,
  '2026-07-21',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-21'
    AND quantity = 5018
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'SSKL' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-21  One Bite - 1000 ml  P 1000 ml  qty=300  amt=833.33  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'One Bite - 1000 ml' LIMIT 1),
  'P 1000 ml',
  300,
  2.777778,
  833.3333,
  '2026-07-21',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-21'
    AND quantity = 300
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'One Bite - 1000 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1)
);

-- 2026-07-21  One Bite - 500 ml  P 500 ml  qty=500  amt=1041.67  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'One Bite - 500 ml' LIMIT 1),
  'P 500 ml',
  500,
  2.083333,
  1041.6667,
  '2026-07-21',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-21'
    AND quantity = 500
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'One Bite - 500 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1)
);

-- 2026-07-25  Ballu Kitchen  P 1000 ml  qty=-566  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballu Kitchen' LIMIT 1),
  'P 1000 ml',
  -566,
  0.0,
  0.0000,
  '2026-07-25',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-25'
    AND quantity = -566
    AND record_type = 'adjustment'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballu Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-25  Element E7  P 1000 ml  qty=-47  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1),
  'P 1000 ml',
  -47,
  0.0,
  0.0000,
  '2026-07-25',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-25'
    AND quantity = -47
    AND record_type = 'adjustment'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-25  Gismat  P 500 ml  qty=793  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  793,
  0.0,
  0.0000,
  '2026-07-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-25'
    AND quantity = 793
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-25  Chaitanya's Modern Kitchen  P 500 ml  qty=574  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  574,
  0.0,
  0.0000,
  '2026-07-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-25'
    AND quantity = 574
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-25  Thatha Kottu Tiffins  P 500 ml  qty=500  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1),
  'P 500 ml',
  500,
  0.0,
  0.0000,
  '2026-07-25',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-25'
    AND quantity = 500
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-25  This is it café  P 500 ml  qty=-2113  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  -2113,
  0.0,
  0.0000,
  '2026-07-25',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-25'
    AND quantity = -2113
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-25  Soul of South  P 500 ml  qty=-3983  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1),
  'P 500 ml',
  -3983,
  0.0,
  0.0000,
  '2026-07-25',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-25'
    AND quantity = -3983
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-25  Alley 91  P 500 ml  qty=-956  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1),
  'P 500 ml',
  -956,
  0.0,
  0.0000,
  '2026-07-25',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-25'
    AND quantity = -956
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-25  Jismat  P 500 ml  qty=-2032  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  -2032,
  0.0,
  0.0000,
  '2026-07-25',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-25'
    AND quantity = -2032
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-25  One Bite - 1000 ml  P 1000 ml  qty=-24  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'One Bite - 1000 ml' LIMIT 1),
  'P 1000 ml',
  -24,
  0.0,
  0.0000,
  '2026-07-25',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-25'
    AND quantity = -24
    AND record_type = 'adjustment'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'One Bite - 1000 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-25  One Bite - 500 ml  P 500 ml  qty=-20  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'One Bite - 500 ml' LIMIT 1),
  'P 500 ml',
  -20,
  0.0,
  0.0000,
  '2026-07-25',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-25'
    AND quantity = -20
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'One Bite - 500 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-30  Jismat  P 500 ml  qty=4131  amt=3899.66  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  4131,
  0.944,
  3899.6640,
  '2026-07-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-30'
    AND quantity = 4131
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-30  Thatha Kottu Tiffins  P 500 ml  qty=2509  amt=2368.50  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1),
  'P 500 ml',
  2509,
  0.944,
  2368.4960,
  '2026-07-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-30'
    AND quantity = 2509
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-30  Benguluru Bhavan  P 500 ml  qty=694  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  694,
  0.0,
  0.0000,
  '2026-07-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-30'
    AND quantity = 694
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-07-30  SSKL  P 250 ml  qty=1014  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'SSKL' LIMIT 1),
  'P 250 ml',
  1014,
  0.0,
  0.0000,
  '2026-07-30',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-07-30'
    AND quantity = 1014
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'SSKL' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-03  Gismat  P 500 ml  qty=3792  amt=3579.65  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1),
  'P 500 ml',
  3792,
  0.944,
  3579.6480,
  '2026-08-03',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-03'
    AND quantity = 3792
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Gismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-03  Chaitanya's Modern Kitchen  P 500 ml  qty=2037  amt=1922.93  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  2037,
  0.944,
  1922.9280,
  '2026-08-03',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-03'
    AND quantity = 2037
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-03  Iron hill café  P 500 ml  qty=4075  amt=3846.80  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1),
  'P 500 ml',
  4075,
  0.944,
  3846.8000,
  '2026-08-03',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-03'
    AND quantity = 4075
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-03  SSKL  P 250 ml  qty=10138  amt=4785.14  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'SSKL' LIMIT 1),
  'P 250 ml',
  10138,
  0.472,
  4785.1360,
  '2026-08-03',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-03'
    AND quantity = 10138
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'SSKL' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-05  Ballu Kitchen  P 1000 ml  qty=2746  amt=3888.34  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballu Kitchen' LIMIT 1),
  'P 1000 ml',
  2746,
  1.416,
  3888.3360,
  '2026-08-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-05'
    AND quantity = 2746
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Ballu Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-05  Element E7  P 1000 ml  qty=2730  amt=3865.68  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1),
  'P 1000 ml',
  2730,
  1.416,
  3865.6800,
  '2026-08-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-05'
    AND quantity = 2730
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-05  Soul of South  P 500 ml  qty=3056  amt=2884.86  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1),
  'P 500 ml',
  3056,
  0.944,
  2884.8640,
  '2026-08-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-05'
    AND quantity = 3056
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-05  Alley 91  P 500 ml  qty=2075  amt=1958.80  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1),
  'P 500 ml',
  2075,
  0.944,
  1958.8000,
  '2026-08-05',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-05'
    AND quantity = 2075
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-10  Rangaswami Milatry Hotel  P 500 ml  qty=1207  amt=1139.41  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Rangaswami Milatry Hotel' LIMIT 1),
  'P 500 ml',
  1207,
  0.944,
  1139.4080,
  '2026-08-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-10'
    AND quantity = 1207
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Rangaswami Milatry Hotel' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-10  Hotel Ellappa - 500 ml  P 500 ml  qty=679  amt=640.98  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Ellappa - 500 ml' LIMIT 1),
  'P 500 ml',
  679,
  0.944,
  640.9760,
  '2026-08-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-10'
    AND quantity = 679
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Ellappa - 500 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-10  Hotel Ellappa - 1000 ml  P 1000 ml  qty=444  amt=628.70  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Ellappa - 1000 ml' LIMIT 1),
  'P 1000 ml',
  444,
  1.416,
  628.7040,
  '2026-08-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-10'
    AND quantity = 444
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Ellappa - 1000 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-10  Maryadha Ramanna  P 500 ml  qty=2150  amt=2029.60  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1),
  'P 500 ml',
  2150,
  0.944,
  2029.6000,
  '2026-08-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-10'
    AND quantity = 2150
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Maryadha Ramanna' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-10  Benguluru Bhavan  P 500 ml  qty=4018  amt=3792.99  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  4018,
  0.944,
  3792.9920,
  '2026-08-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-10'
    AND quantity = 4018
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-11  SSKL  P 250 ml  qty=10232  amt=4829.50  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'SSKL' LIMIT 1),
  'P 250 ml',
  10232,
  0.472,
  4829.5040,
  '2026-08-11',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-11'
    AND quantity = 10232
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'SSKL' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-11  Biryanis and More  P 1000 ml  qty=3162  amt=1492.46  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  3162,
  0.472,
  1492.4640,
  '2026-08-11',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-11'
    AND quantity = 3162
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-11  Biryanis and More  P 1000 ml  qty=5158  amt=7303.73  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  5158,
  1.416,
  7303.7280,
  '2026-08-11',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-11'
    AND quantity = 5158
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-11  Aha Bengali  P 1000 ml  qty=730  amt=1033.68  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Aha Bengali' LIMIT 1),
  'P 1000 ml',
  730,
  1.416,
  1033.6800,
  '2026-08-11',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-11'
    AND quantity = 730
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Aha Bengali' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-11  Illuzion  P 500 ml  qty=1132  amt=1202.18  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion' LIMIT 1),
  'P 500 ml',
  1132,
  1.062,
  1202.1840,
  '2026-08-11',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-11'
    AND quantity = 1132
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Illuzion' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-11  Jismat  P 500 ml  qty=9  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  9,
  0.0,
  0.0000,
  '2026-08-11',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-11'
    AND quantity = 9
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-14  Hiyya Dino Mandi  P 500 ml  qty=-30  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1),
  'P 500 ml',
  -30,
  0.0,
  0.0000,
  '2026-08-14',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-14'
    AND quantity = -30
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-24  Jismat  P 500 ml  qty=1840  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  1840,
  0.0,
  0.0000,
  '2026-08-24',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-24'
    AND quantity = 1840
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-24  This is it café  P 500 ml  qty=1000  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  1000,
  0.0,
  0.0000,
  '2026-08-24',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-24'
    AND quantity = 1000
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-23  Finora - 1000 ml  P 1000 ml  qty=841  amt=1190.86  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Finora - 1000 ml' LIMIT 1),
  'P 1000 ml',
  841,
  1.416,
  1190.8560,
  '2026-08-23',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-23'
    AND quantity = 841
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Finora - 1000 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-23  Finora - 250 ml  P 250 ml  qty=4302  amt=2030.54  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Finora - 250 ml' LIMIT 1),
  'P 250 ml',
  4302,
  0.472,
  2030.5440,
  '2026-08-23',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-23'
    AND quantity = 4302
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Finora - 250 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-23  Jismat  P 500 ml  qty=6131  amt=5787.66  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1),
  'P 500 ml',
  6131,
  0.944,
  5787.6640,
  '2026-08-23',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-23'
    AND quantity = 6131
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Jismat' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-23  This is it café  P 500 ml  qty=2056  amt=1940.86  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'P 500 ml',
  2056,
  0.944,
  1940.8640,
  '2026-08-23',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-23'
    AND quantity = 2056
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-21  Benguluru Bhavan  P 500 ml  qty=4018  amt=3792.99  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1),
  'P 500 ml',
  4018,
  0.944,
  3792.9920,
  '2026-08-21',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-21'
    AND quantity = 4018
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Benguluru Bhavan' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-21  Biryanis and More  P 1000 ml  qty=5031  amt=7123.90  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  5031,
  1.416,
  7123.8960,
  '2026-08-21',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-21'
    AND quantity = 5031
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-18  Hiyya Dino Mandi  P 500 ml  qty=2132  amt=2012.61  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1),
  'P 500 ml',
  2132,
  0.944,
  2012.6080,
  '2026-08-18',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-18'
    AND quantity = 2132
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-18  Chaitanya's Modern Kitchen  P 500 ml  qty=4056  amt=3828.86  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1),
  'P 500 ml',
  4056,
  0.944,
  3828.8640,
  '2026-08-18',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-18'
    AND quantity = 4056
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Chaitanya''s Modern Kitchen' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-26  TOS Club & Lounge  P 1000 ml  qty=352  amt=1100.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'TOS Club & Lounge' LIMIT 1),
  'P 1000 ml',
  352,
  3.125,
  1100.0000,
  '2026-08-26',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-26'
    AND quantity = 352
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'TOS Club & Lounge' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1)
);

-- 2026-08-26  Alley 91 - 250 ml  P 250 ml  qty=640  amt=800.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91 - 250 ml' LIMIT 1),
  'P 250 ml',
  640,
  1.25,
  800.0000,
  '2026-08-26',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-26'
    AND quantity = 640
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91 - 250 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='jsr printers' LIMIT 1)
);

-- 2026-08-27  TOS Club & Lounge  P 1000 ml  qty=1301  amt=1842.22  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'TOS Club & Lounge' LIMIT 1),
  'P 1000 ml',
  1301,
  1.416,
  1842.2160,
  '2026-08-27',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-27'
    AND quantity = 1301
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'TOS Club & Lounge' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-27  Element E7  P 1000 ml  qty=2666  amt=3775.06  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1),
  'P 1000 ml',
  2666,
  1.416,
  3775.0560,
  '2026-08-27',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-27'
    AND quantity = 2666
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Element E7' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-27  Hiyya Dino Mandi  P 500 ml  qty=4113  amt=3882.67  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1),
  'P 500 ml',
  4113,
  0.944,
  3882.6720,
  '2026-08-27',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-27'
    AND quantity = 4113
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Dino Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-31  Finora - 1000 ml  P 1000 ml  qty=-193  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Finora - 1000 ml' LIMIT 1),
  'P 1000 ml',
  -193,
  0.0,
  0.0000,
  '2026-08-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-31'
    AND quantity = -193
    AND record_type = 'adjustment'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Finora - 1000 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-31  Twilight Embassy  P 500 ml  qty=-207  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Twilight Embassy' LIMIT 1),
  'P 500 ml',
  -207,
  0.0,
  0.0000,
  '2026-08-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-31'
    AND quantity = -207
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Twilight Embassy' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-31  Aha Bengali  P 1000 ml  qty=-70  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Aha Bengali' LIMIT 1),
  'P 1000 ml',
  -70,
  0.0,
  0.0000,
  '2026-08-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-31'
    AND quantity = -70
    AND record_type = 'adjustment'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Aha Bengali' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-08-31  Biryanis and More  P 1000 ml  qty=-12  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  -12,
  0.0,
  0.0000,
  '2026-08-31',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-08-31'
    AND quantity = -12
    AND record_type = 'adjustment'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-01  Hiyya Chrono Jail Mandi  P 500 ml  qty=4207  amt=3971.41  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1),
  'P 500 ml',
  4207,
  0.944,
  3971.4080,
  '2026-09-01',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-01'
    AND quantity = 4207
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hiyya Chrono Jail Mandi' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-01  Hotel Vinflora  P 500 ml  qty=1093  amt=1031.79  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Vinflora' LIMIT 1),
  'P 500 ml',
  1093,
  0.944,
  1031.7920,
  '2026-09-01',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-01'
    AND quantity = 1093
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Vinflora' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-01  Soul of South  P 500 ml  qty=2452  amt=2314.69  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1),
  'P 500 ml',
  2452,
  0.944,
  2314.6880,
  '2026-09-01',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-01'
    AND quantity = 2452
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Soul of South' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-01  Alley 91  P 500 ml  qty=2396  amt=2261.82  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1),
  'P 500 ml',
  2396,
  0.944,
  2261.8240,
  '2026-09-01',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-01'
    AND quantity = 2396
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-01  House party  P 500 ml  qty=2094  amt=1976.74  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'House party' LIMIT 1),
  'P 500 ml',
  2094,
  0.944,
  1976.7360,
  '2026-09-01',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-01'
    AND quantity = 2094
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'House party' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-01  Alley 91 - 250 ml  P 250 ml  qty=3206  amt=2080.69  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91 - 250 ml' LIMIT 1),
  'P 250 ml',
  3206,
  0.649,
  2080.6940,
  '2026-09-01',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-01'
    AND quantity = 3206
    AND record_type = 'purchase'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91 - 250 ml' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-01  TOS Club & Lounge  P 1000 ml  qty=-33  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'TOS Club & Lounge' LIMIT 1),
  'P 1000 ml',
  -33,
  0.0,
  0.0000,
  '2026-09-01',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-01'
    AND quantity = -33
    AND record_type = 'adjustment'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'TOS Club & Lounge' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-08  Thatha Kottu Tiffins  P 500 ml  qty=-9  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1),
  'P 500 ml',
  -9,
  0.0,
  0.0000,
  '2026-09-08',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-08'
    AND quantity = -9
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-10  Biryanis and More  P 1000 ml  qty=13244  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  13244,
  0.0,
  0.0000,
  '2026-09-10',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-10'
    AND quantity = 13244
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-10  SSKL  P 250 ml  qty=-1832  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'SSKL' LIMIT 1),
  'P 250 ml',
  -1832,
  0.0,
  0.0000,
  '2026-09-10',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-10'
    AND quantity = -1832
    AND record_type = 'adjustment'
    AND sku = 'P 250 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'SSKL' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-10  Hotel Vinflora  P 500 ml  qty=-93  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Vinflora' LIMIT 1),
  'P 500 ml',
  -93,
  0.0,
  0.0000,
  '2026-09-10',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-10'
    AND quantity = -93
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Hotel Vinflora' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-11  Twilight Embassy  P 500 ml  qty=1132  amt=1068.61  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Twilight Embassy' LIMIT 1),
  'P 500 ml',
  1132,
  0.944,
  1068.6080,
  '2026-09-11',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-11'
    AND quantity = 1132
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Twilight Embassy' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-11  Thatha Kottu Tiffins  P 500 ml  qty=1113  amt=1050.67  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1),
  'P 500 ml',
  1113,
  0.944,
  1050.6720,
  '2026-09-11',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-11'
    AND quantity = 1113
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-11  Biryanis and More  P 1000 ml  qty=5205  amt=7370.28  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1),
  'P 1000 ml',
  5205,
  1.416,
  7370.2800,
  '2026-09-11',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-11'
    AND quantity = 5205
    AND record_type = 'purchase'
    AND sku = 'P 1000 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Biryanis and More' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-14  Twilight Embassy  P 500 ml  qty=-72  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Twilight Embassy' LIMIT 1),
  'P 500 ml',
  -72,
  0.0,
  0.0000,
  '2026-09-14',
  'adjustment',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-14'
    AND quantity = -72
    AND record_type = 'adjustment'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Twilight Embassy' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);

-- 2026-09-22  Thatha Kottu Tiffins  P 500 ml  qty=247  amt=0.00  vendor=(SELECT id FROM publ...
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1),
  'P 500 ml',
  247,
  0.0,
  0.0000,
  '2026-09-22',
  'purchase',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-22'
    AND quantity = 247
    AND record_type = 'purchase'
    AND sku = 'P 500 ml'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Thatha Kottu Tiffins' LIMIT 1)
    AND vendor_id IS NOT DISTINCT FROM (SELECT id FROM public.label_vendors WHERE lower(vendor_name)='morya labels' LIMIT 1)
);
