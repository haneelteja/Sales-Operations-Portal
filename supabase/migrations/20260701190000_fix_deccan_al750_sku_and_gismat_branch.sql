-- Fix Deccan kitchen AL 750 ml SKU mismatches and Gismat Main office → Kondapur branch (2026-07-01).

-- === DECCAN KITCHEN: P 750 ml → AL 750 ml ===
-- Factory 5/6: entered as P 750 ml, Elma shows AL 750 ml
UPDATE public.factory_payables SET sku = 'AL 750 ml'
WHERE id = '864c91f3-3e96-4055-9516-f8c1f03ed11e'; -- 5/6 qty 78

-- Sales 4/11: qty 94 (= 4/2 factory 36 + 4/11 factory 58), entered as P 750 ml
UPDATE public.sales_transactions SET sku = 'AL 750 ml'
WHERE id = '69c24326-38bf-4edb-9c16-5110088b81d9'; -- 4/11 qty 94

-- Sales 5/6: entered as P 750 ml, Elma shows AL 750 ml
UPDATE public.sales_transactions SET sku = 'AL 750 ml'
WHERE id = 'e1688325-3163-4d12-9646-83e482cd9a09'; -- 5/6 qty 78

-- === GISMAT: Main office → Kondapur (branch mismatch on factory and sales) ===
-- Factory 7/16 (49 qty) and 10/27 (10 qty) were recorded under Main office customer_id
UPDATE public.factory_payables SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b'
WHERE id = 'c3b2e75b-fdde-46b6-aa78-3e911edbd210'; -- 7/16 qty 49

UPDATE public.factory_payables SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b'
WHERE id = '4d7c6fcc-20a4-48bc-8160-f952e3f2b9f2'; -- 10/27 qty 10

-- Sales 10/27 (10 qty) was recorded under Main office customer_id
UPDATE public.sales_transactions SET customer_id = 'e9f73706-c210-4534-83c7-b03abcc2941b'
WHERE id = 'a16fe045-4bc4-4fdb-a042-a173fc42c896'; -- 10/27 qty 10
