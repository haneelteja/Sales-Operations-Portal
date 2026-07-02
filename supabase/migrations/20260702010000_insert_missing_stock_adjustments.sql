-- Insert 15 stock adjustments present in Elma ledger but missing from DB.
-- These are negative-qty 'sale' entries representing returns/cancellations.
-- All use NOT EXISTS guards so they are idempotent.

-- 1: Biryanis and More, Ongole 5/18/2025 — return −1 P 1000 ml ₹192.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT (SELECT id FROM public.customers WHERE client_name ILIKE '%Biryanis%More%' AND branch ILIKE '%Ongole%' LIMIT 1),
       '2025-05-18', 'sale', 'P 1000 ml', -1, -192.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  JOIN public.customers c ON st.customer_id = c.id
  WHERE st.transaction_date = '2025-05-18' AND st.transaction_type = 'sale'
    AND c.branch ILIKE '%Ongole%' AND st.quantity = -1 AND st.sku = 'P 1000 ml'
);

-- 2: Gismat-Ameerpet 6/14/2025 — return −20 P 500 ml ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '071556e7-be52-4caf-98a7-c0f09210978f', '2025-06-14', 'sale', 'P 500 ml', -20, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '071556e7-be52-4caf-98a7-c0f09210978f'
    AND transaction_date = '2025-06-14' AND transaction_type = 'sale'
    AND quantity = -20 AND sku = 'P 500 ml'
);

-- 3: Gismat-Kondapur 6/14/2025 — return −20 P 500 ml ₹3,320.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT (SELECT id FROM public.customers WHERE (client_name = 'Gismat' OR client_name = 'Jismat') AND branch = 'Kondapur' LIMIT 1),
       '2025-06-14', 'sale', 'P 500 ml', -20, -3320.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  JOIN public.customers c ON st.customer_id = c.id
  WHERE st.transaction_date = '2025-06-14' AND st.transaction_type = 'sale'
    AND (c.client_name = 'Gismat' OR c.client_name = 'Jismat') AND c.branch = 'Kondapur'
    AND st.quantity = -20 AND st.sku = 'P 500 ml'
);

-- 4: Biryanis and More, Ongole 7/27/2025 — return −5 P 1000 ml ₹960.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT (SELECT id FROM public.customers WHERE client_name ILIKE '%Biryanis%More%' AND branch ILIKE '%Ongole%' LIMIT 1),
       '2025-07-27', 'sale', 'P 1000 ml', -5, -960.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  JOIN public.customers c ON st.customer_id = c.id
  WHERE st.transaction_date = '2025-07-27' AND st.transaction_type = 'sale'
    AND c.branch ILIKE '%Ongole%' AND st.quantity = -5 AND st.sku = 'P 1000 ml'
);

-- 5: Chaitanya's Modern Kitchen 9/23/2025 — return −33 P 500 ml ₹0 (Alley 91 adjustment).
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '4cada784-9ab9-4f68-9571-11d59ad6af9d', '2025-09-23', 'sale', 'P 500 ml', -33, 0.00, 'Alley 91 adjustment'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '4cada784-9ab9-4f68-9571-11d59ad6af9d'
    AND transaction_date = '2025-09-23' AND transaction_type = 'sale'
    AND quantity = -33
);

-- 6: Biryanis and More, Narakoduru 11/2/2025 — return −20 P 1000 ml ₹3,480.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT (SELECT id FROM public.customers WHERE client_name ILIKE '%Biryanis%More%' AND branch ILIKE '%Narakoduru%' LIMIT 1),
       '2025-11-02', 'sale', 'P 1000 ml', -20, -3480.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  JOIN public.customers c ON st.customer_id = c.id
  WHERE st.transaction_date = '2025-11-02' AND st.transaction_type = 'sale'
    AND c.branch ILIKE '%Narakoduru%' AND st.quantity = -20 AND st.sku = 'P 1000 ml'
);

-- 7: Biryanis and More, Narakoduru 11/2/2025 — return −11.67 P 1000 ml ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT (SELECT id FROM public.customers WHERE client_name ILIKE '%Biryanis%More%' AND branch ILIKE '%Narakoduru%' LIMIT 1),
       '2025-11-02', 'sale', 'P 1000 ml', -11.67, 0.00, 'Return'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  JOIN public.customers c ON st.customer_id = c.id
  WHERE st.transaction_date = '2025-11-02' AND st.transaction_type = 'sale'
    AND c.branch ILIKE '%Narakoduru%' AND st.quantity = -11.67 AND st.sku = 'P 1000 ml'
);

-- 8: Gismat-Dilshuknagar 11/5/2025 — return −25 P 500 ml ₹4,150.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT (SELECT id FROM public.customers WHERE (client_name = 'Jismat' OR client_name = 'Gismat') AND branch = 'Dilshuknagar' LIMIT 1),
       '2025-11-05', 'sale', 'P 500 ml', -25, -4150.00, 'Adj Gismat-Ameerpet to Dilshuknagar'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  JOIN public.customers c ON st.customer_id = c.id
  WHERE st.transaction_date = '2025-11-05' AND st.transaction_type = 'sale'
    AND (c.client_name = 'Jismat' OR c.client_name = 'Gismat') AND c.branch = 'Dilshuknagar'
    AND st.quantity = -25 AND st.sku = 'P 500 ml'
);

-- 9: Gismat-Ameerpet 11/5/2025 — return −25 P 500 ml ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '071556e7-be52-4caf-98a7-c0f09210978f', '2025-11-05', 'sale', 'P 500 ml', -25, 0.00, 'Adj Gismat-Ameerpet to Dilshuknagar'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = '071556e7-be52-4caf-98a7-c0f09210978f'
    AND transaction_date = '2025-11-05' AND transaction_type = 'sale'
    AND quantity = -25 AND sku = 'P 500 ml'
);

-- 10: P 1000 ml return 11/11/2025 — −60 P 1000 ml ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT (SELECT id FROM public.customers WHERE client_name = 'P 1000 ml return' LIMIT 1),
       '2025-11-11', 'sale', 'P 1000 ml', -60, 0.00, 'Return'
WHERE (SELECT id FROM public.customers WHERE client_name = 'P 1000 ml return' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_transactions st
    JOIN public.customers c ON st.customer_id = c.id
    WHERE st.transaction_date = '2025-11-11' AND c.client_name = 'P 1000 ml return'
      AND st.quantity = -60
  );

-- 11: P 500 ml return 11/11/2025 — −20 P 500 ml ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT (SELECT id FROM public.customers WHERE client_name = 'P 500 ml return' LIMIT 1),
       '2025-11-11', 'sale', 'P 500 ml', -20, 0.00, 'Return'
WHERE (SELECT id FROM public.customers WHERE client_name = 'P 500 ml return' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_transactions st
    JOIN public.customers c ON st.customer_id = c.id
    WHERE st.transaction_date = '2025-11-11' AND c.client_name = 'P 500 ml return'
      AND st.quantity = -20
  );

-- 12: Soul of South 12/23/2025 — return −1 P 500 ml ₹0.
-- Uses ILIKE for client_name; branch filter excludes Financial District variant.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT (SELECT id FROM public.customers WHERE client_name ILIKE 'soul of south' AND client_name NOT ILIKE '%Financial%' LIMIT 1),
       '2025-12-23', 'sale', 'P 500 ml', -1, 0.00, 'Return'
WHERE (SELECT id FROM public.customers WHERE client_name ILIKE 'soul of south' AND client_name NOT ILIKE '%Financial%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_transactions st
    JOIN public.customers c ON st.customer_id = c.id
    WHERE st.transaction_date = '2025-12-23' AND c.client_name ILIKE 'soul of south'
      AND c.client_name NOT ILIKE '%Financial%'
      AND st.quantity = -1 AND st.sku = 'P 500 ml'
  );

-- 13: Soul of South 1/23/2026 — return −50 P 500 ml ₹8,500.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT (SELECT id FROM public.customers WHERE client_name ILIKE 'soul of south' AND client_name NOT ILIKE '%Financial%' LIMIT 1),
       '2026-01-23', 'sale', 'P 500 ml', -50, -8500.00, 'Return stock'
WHERE (SELECT id FROM public.customers WHERE client_name ILIKE 'soul of south' AND client_name NOT ILIKE '%Financial%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_transactions st
    JOIN public.customers c ON st.customer_id = c.id
    WHERE st.transaction_date = '2026-01-23' AND c.client_name ILIKE 'soul of south'
      AND c.client_name NOT ILIKE '%Financial%'
      AND st.quantity = -50 AND st.sku = 'P 500 ml'
  );

-- 14: Soul of South 1/23/2026 — return −1 P 500 ml ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT (SELECT id FROM public.customers WHERE client_name ILIKE 'soul of south' AND client_name NOT ILIKE '%Financial%' LIMIT 1),
       '2026-01-23', 'sale', 'P 500 ml', -1, 0.00, 'Return'
WHERE (SELECT id FROM public.customers WHERE client_name ILIKE 'soul of south' AND client_name NOT ILIKE '%Financial%' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_transactions st
    JOIN public.customers c ON st.customer_id = c.id
    WHERE st.transaction_date = '2026-01-23' AND c.client_name ILIKE 'soul of south'
      AND c.client_name NOT ILIKE '%Financial%'
      AND st.quantity = -1 AND st.sku = 'P 500 ml' AND st.amount = 0.00
  );

-- 15: Alley 91 - 250 ml 1/27/2026 — return −10 250 EC ₹0.
INSERT INTO public.sales_transactions (customer_id, transaction_date, transaction_type, sku, quantity, amount, description)
SELECT (SELECT id FROM public.customers WHERE client_name = 'Alley 91 - 250 ml' LIMIT 1),
       '2026-01-27', 'sale', '250 EC', -10, 0.00, 'Return'
WHERE (SELECT id FROM public.customers WHERE client_name = 'Alley 91 - 250 ml' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_transactions st
    JOIN public.customers c ON st.customer_id = c.id
    WHERE st.transaction_date = '2026-01-27' AND c.client_name = 'Alley 91 - 250 ml'
      AND st.quantity = -10
  );
