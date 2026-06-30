-- Fix June 2025 sales_transactions discrepancies vs Elma ledger (2026-06-30).

-- Fix 1: House party 6/1 — qty 72→73.
UPDATE public.sales_transactions
SET quantity = 73
WHERE id = 'ebfc972f-2ad7-4948-a581-91e2433b93b8';

-- Fix 2: Tilaks kitchen payment 6/2 — ₹29,999.98→₹30,000.
UPDATE public.sales_transactions
SET amount = 30000.00
WHERE id = 'ebeebc49-eec1-4921-b633-eb69c93b18cd';

-- Fix 3: Golden Pavilion 6/12 — qty 43→45 (amount ₹7,560 already correct at 45×₹168).
UPDATE public.sales_transactions
SET quantity = 45
WHERE id = '366883d7-0313-4624-b1dd-b6b720e441ca';

-- Fix 4: Tilaks kitchen — date 6/17→6/15, qty 27→29, amount ₹4,590→₹4,930.
UPDATE public.sales_transactions
SET transaction_date = '2025-06-15',
    quantity         = 29,
    amount           = 4930.00
WHERE id = '551e063f-d9dd-42f4-a52b-59434ad38c62';

-- Fix 5: Varsha Hotel 6/24 — qty 16→15, amount ₹2,880→₹2,700.
UPDATE public.sales_transactions
SET quantity = 15,
    amount   = 2700.00
WHERE id = '94a35bd0-72ed-4f69-9cfc-6d31b6a61c51';

-- Fix 6: Tonique 6/26 — qty 161→162, amount ₹27,048→₹27,216.
UPDATE public.sales_transactions
SET quantity = 162,
    amount   = 27216.00
WHERE id = '33cf106e-bda6-4358-944f-2446c2f4f75b';

-- Fix 7: Gismat-Chandha Nagar 6/30 — qty 49→50.
UPDATE public.sales_transactions
SET quantity = 50
WHERE id = '783b86a0-26ad-4959-a37d-bce159bd90b9';

-- Fix 8: Gismat-Pragathi nagar 6/30 — amount ₹8,500→₹8,300.
UPDATE public.sales_transactions
SET amount = 8300.00
WHERE id = '1be88bab-6d98-480c-985b-ea9342cae0e0';

-- Fix 9: Good Vibes payment — date 6/24→6/25.
UPDATE public.sales_transactions
SET transaction_date = '2025-06-25'
WHERE id = '590a23e6-d81f-4b4c-a105-75f729ba4b9b';

-- Fix 10: Mid land 6/26 — wrong customer (b886e6cc Telangana)→correct (52688e1f Telangana),
--         wrong SKU AL 750ml→P 1000ml, qty 64→ same, amount stays.
UPDATE public.sales_transactions
SET customer_id = '52688e1f-be29-4a5a-9f20-83c245030ec2',
    sku         = 'P 1000 ml'
WHERE id = '88c26596-fc9a-4794-a3ee-f4aa919f32fb';

-- Insert 1: Benguluru Bhavan 6/5 — return −4 P 500ml ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '69f93fbc-ffa7-4e8c-94a7-67f16290f522', '2025-06-05', 'sale', 'P 500 ml', -4, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '69f93fbc-ffa7-4e8c-94a7-67f16290f522'
    AND transaction_date = '2025-06-05' AND transaction_type = 'sale'
    AND sku = 'P 500 ml' AND quantity = -4
);

-- Insert 2: Varsha Hotel 6/7 — 1 P 1000ml ₹180.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '261fef6d-e789-4a44-b80d-cbace24632c1', '2025-06-07', 'sale', 'P 1000 ml', 1, 180.00, 'Stock Delivered'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '261fef6d-e789-4a44-b80d-cbace24632c1'
    AND transaction_date = '2025-06-07' AND transaction_type = 'sale'
    AND sku = 'P 1000 ml' AND quantity = 1
);

-- Insert 3: Varsha Hotel 6/7 — return −1 P 1000ml ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '261fef6d-e789-4a44-b80d-cbace24632c1', '2025-06-07', 'sale', 'P 1000 ml', -1, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '261fef6d-e789-4a44-b80d-cbace24632c1'
    AND transaction_date = '2025-06-07' AND transaction_type = 'sale'
    AND sku = 'P 1000 ml' AND quantity = -1
);

-- Insert 4: Fusion Aroma 6/10 — 10 P 1000ml ₹1,740.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '2e93416d-50bb-4751-85ce-66655d818df7', '2025-06-10', 'sale', 'P 1000 ml', 10, 1740.00, 'Stock Delivered'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '2e93416d-50bb-4751-85ce-66655d818df7'
    AND transaction_date = '2025-06-10' AND transaction_type = 'sale'
    AND sku = 'P 1000 ml' AND quantity = 10
);

-- Insert 5: Fusion Aroma 6/10 — payment ₹206.33.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, amount, description)
SELECT '2e93416d-50bb-4751-85ce-66655d818df7', '2025-06-10', 'payment', 206.33, 'Payment'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '2e93416d-50bb-4751-85ce-66655d818df7'
    AND transaction_date = '2025-06-10' AND transaction_type = 'payment' AND amount = 206.33
);

-- Insert 6: Fusion Aroma 6/10 — return −10 P 1000ml ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '2e93416d-50bb-4751-85ce-66655d818df7', '2025-06-10', 'sale', 'P 1000 ml', -10, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '2e93416d-50bb-4751-85ce-66655d818df7'
    AND transaction_date = '2025-06-10' AND transaction_type = 'sale'
    AND sku = 'P 1000 ml' AND quantity = -10
);

-- Insert 7: Fusion Aroma 6/12 — 40 P 1000ml ₹6,960.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '2e93416d-50bb-4751-85ce-66655d818df7', '2025-06-12', 'sale', 'P 1000 ml', 40, 6960.00, 'Stock Delivered'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '2e93416d-50bb-4751-85ce-66655d818df7'
    AND transaction_date = '2025-06-12' AND transaction_type = 'sale'
    AND sku = 'P 1000 ml' AND quantity = 40
);

-- Insert 8: Fusion Aroma 6/12 — return −20 P 1000ml ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '2e93416d-50bb-4751-85ce-66655d818df7', '2025-06-12', 'sale', 'P 1000 ml', -20, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '2e93416d-50bb-4751-85ce-66655d818df7'
    AND transaction_date = '2025-06-12' AND transaction_type = 'sale'
    AND sku = 'P 1000 ml' AND quantity = -20
);

-- Insert 9: Tilaks kitchen 6/15 — return −1 P 500ml ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6', '2025-06-15', 'sale', 'P 500 ml', -1, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6'
    AND transaction_date = '2025-06-15' AND transaction_type = 'sale'
    AND sku = 'P 500 ml' AND quantity = -1
);

-- Insert 10: Biryanis Gachibowli 6/24 — return −10 P 1000ml ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '8ea3202d-2fab-478a-9ca3-390cbd17f4fe', '2025-06-24', 'sale', 'P 1000 ml', -10, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '8ea3202d-2fab-478a-9ca3-390cbd17f4fe'
    AND transaction_date = '2025-06-24' AND transaction_type = 'sale'
    AND sku = 'P 1000 ml' AND quantity = -10
);

-- Insert 11: Tonique 6/26 — return −1 P 1000ml ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '1b65d5d1-0ffe-4669-9204-4f008134bd7e', '2025-06-26', 'sale', 'P 1000 ml', -1, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '1b65d5d1-0ffe-4669-9204-4f008134bd7e'
    AND transaction_date = '2025-06-26' AND transaction_type = 'sale'
    AND sku = 'P 1000 ml' AND quantity = -1
);
